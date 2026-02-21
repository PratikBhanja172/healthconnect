import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Shield, Stethoscope, User, ArrowLeft } from "lucide-react";

type Role = "admin" | "doctor" | "patient";

const roleConfig = {
  admin: { icon: Shield, label: "Admin", color: "text-primary", desc: "System administrator" },
  doctor: { icon: Stethoscope, label: "Doctor", color: "text-primary", desc: "Medical professional" },
  patient: { icon: User, label: "Patient", color: "text-primary", desc: "Book appointments" },
};

export default function AuthPage() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Logged in successfully!");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role: selectedRole, specialization },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Account created! Please check your email to verify.");
        return;
      }

      // Redirect based on role
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();

        const role = roles?.role;
        if (role === "admin") navigate("/admin");
        else if (role === "doctor") navigate("/doctor");
        else navigate("/patient");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  if (!selectedRole) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gradient mb-2">MediCare</h1>
          <p className="text-muted-foreground text-lg">Healthcare Appointment Management</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
          {(Object.entries(roleConfig) as [Role, typeof roleConfig.admin][]).map(([role, config]) => {
            const Icon = config.icon;
            return (
              <Card
                key={role}
                className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-2 hover:border-primary/50"
                onClick={() => setSelectedRole(role)}
              >
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto w-16 h-16 rounded-full gradient-primary flex items-center justify-center mb-3">
                    <Icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-xl">{config.label}</CardTitle>
                  <CardDescription>{config.desc}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button variant="outline" className="w-full">
                    Continue as {config.label}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  const RoleIcon = roleConfig[selectedRole].icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-4 top-4"
            onClick={() => setSelectedRole(null)}
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div className="mx-auto w-14 h-14 rounded-full gradient-primary flex items-center justify-center mb-3">
            <RoleIcon className="w-7 h-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">{roleConfig[selectedRole].label} Portal</CardTitle>
          <CardDescription>
            {isLogin ? "Sign in to your account" : "Create a new account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={isLogin ? "login" : "register"} onValueChange={(v) => setIsLogin(v === "login")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={!isLogin}
                    placeholder="Dr. John Doe"
                  />
                </div>
              )}

              {!isLogin && selectedRole === "doctor" && (
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    required
                    placeholder="e.g. Cardiologist, Dermatologist"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                />
              </div>

              <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
                {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
              </Button>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
