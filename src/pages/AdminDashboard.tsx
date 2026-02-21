import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { LogOut, Clock, CheckCircle, XCircle, Users, Hash } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AppointmentWithDoctor {
  id: string;
  patient_name: string;
  patient_age: number;
  symptoms: string;
  preferred_date: string;
  preferred_time: string;
  status: string;
  token_number: number | null;
  assigned_time: string | null;
  created_at: string;
  doctors: { full_name: string; specialization: string } | null;
}

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentWithDoctor[]>([]);
  const [assignedTimes, setAssignedTimes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    const { data } = await supabase
      .from("appointments")
      .select("*, doctors(full_name, specialization)")
      .order("created_at", { ascending: false });
    if (data) setAppointments(data as any);
  };

  const handleAction = async (id: string, action: "accepted" | "rejected") => {
    try {
      if (action === "accepted") {
        const time = assignedTimes[id];
        if (!time) {
          toast.error("Please assign a time before accepting");
          return;
        }
        // Generate token number
        const { data: existing } = await supabase
          .from("appointments")
          .select("token_number")
          .eq("status", "accepted")
          .order("token_number", { ascending: false })
          .limit(1);

        const nextToken = (existing?.[0]?.token_number || 0) + 1;

        const { error } = await supabase
          .from("appointments")
          .update({ status: "accepted", token_number: nextToken, assigned_time: time })
          .eq("id", id);

        if (error) throw error;
        toast.success(`Appointment accepted! Token #${nextToken} assigned.`);
      } else {
        const { error } = await supabase
          .from("appointments")
          .update({ status: "rejected" })
          .eq("id", id);

        if (error) throw error;
        toast.success("Appointment rejected.");
      }
      fetchAppointments();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filterByStatus = (status: string) => appointments.filter((a) => a.status === status);

  const AppointmentCard = ({ apt, showActions }: { apt: AppointmentWithDoctor; showActions: boolean }) => (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="py-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-lg">{apt.patient_name}</span>
              <span className="text-sm text-muted-foreground">Age: {apt.patient_age}</span>
            </div>
            <p className="text-sm"><span className="font-medium">Symptoms:</span> {apt.symptoms}</p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Doctor:</span> Dr. {apt.doctors?.full_name} ({apt.doctors?.specialization})
            </p>
            <p className="text-sm text-muted-foreground">
              Preferred: {format(new Date(apt.preferred_date), "PPP")} at {apt.preferred_time}
            </p>
            {apt.token_number && (
              <p className="text-sm font-medium text-success flex items-center gap-1">
                <Hash className="w-3 h-3" /> Token #{apt.token_number} — {apt.assigned_time}
              </p>
            )}
          </div>

          {showActions && (
            <div className="flex flex-col gap-2 min-w-[200px]">
              <Input
                placeholder="Assign time (e.g. 10:30 AM)"
                value={assignedTimes[apt.id] || ""}
                onChange={(e) => setAssignedTimes((prev) => ({ ...prev, [apt.id]: e.target.value }))}
              />
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 bg-success hover:bg-success/90 text-success-foreground" onClick={() => handleAction(apt.id, "accepted")}>
                  <CheckCircle className="w-4 h-4 mr-1" /> Accept
                </Button>
                <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleAction(apt.id, "rejected")}>
                  <XCircle className="w-4 h-4 mr-1" /> Reject
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gradient">MediCare Admin</h1>
            <p className="text-sm text-muted-foreground">Manage appointments</p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Pending", count: filterByStatus("pending").length, icon: Clock, color: "text-warning" },
            { label: "Accepted", count: filterByStatus("accepted").length, icon: CheckCircle, color: "text-success" },
            { label: "Rejected", count: filterByStatus("rejected").length, icon: XCircle, color: "text-destructive" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 py-4">
                <stat.icon className={cn("w-8 h-8", stat.color)} />
                <div>
                  <p className="text-2xl font-bold">{stat.count}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="pending" className="gap-1"><Clock className="w-4 h-4" /> Pending ({filterByStatus("pending").length})</TabsTrigger>
            <TabsTrigger value="accepted" className="gap-1"><CheckCircle className="w-4 h-4" /> Accepted</TabsTrigger>
            <TabsTrigger value="rejected" className="gap-1"><XCircle className="w-4 h-4" /> Rejected</TabsTrigger>
          </TabsList>

          {["pending", "accepted", "rejected"].map((status) => (
            <TabsContent key={status} value={status} className="space-y-4">
              {filterByStatus(status).length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground">No {status} appointments.</CardContent></Card>
              ) : (
                filterByStatus(status).map((apt) => (
                  <AppointmentCard key={apt.id} apt={apt} showActions={status === "pending"} />
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
}
