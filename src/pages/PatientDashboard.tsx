import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { LogOut, Send, Clock, CheckCircle, XCircle, Stethoscope, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Doctor {
  id: string;
  full_name: string;
  specialization: string;
  availability: string;
}

interface Appointment {
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

export default function PatientDashboard() {
  const { user, signOut } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDoctors();
    fetchAppointments();
  }, [user]);

  const fetchDoctors = async () => {
    const { data } = await supabase.from("doctors").select("*");
    if (data) setDoctors(data);
  };

  const fetchAppointments = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("appointments")
      .select("*, doctors(full_name, specialization)")
      .eq("patient_user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setAppointments(data as any);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedDate) return;
    setSubmitting(true);

    try {
      const { error } = await supabase.from("appointments").insert({
        patient_user_id: user.id,
        patient_name: patientName,
        patient_age: parseInt(patientAge),
        symptoms,
        doctor_id: selectedDoctor,
        preferred_date: format(selectedDate, "yyyy-MM-dd"),
        preferred_time: preferredTime,
      });

      if (error) throw error;
      toast.success("Appointment request sent successfully!");
      setSymptoms("");
      setPatientName("");
      setPatientAge("");
      setPreferredTime("");
      setSelectedDoctor("");
      fetchAppointments();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const statusIcon = (status: string) => {
    if (status === "accepted") return <CheckCircle className="w-4 h-4 text-success" />;
    if (status === "rejected") return <XCircle className="w-4 h-4 text-destructive" />;
    return <Clock className="w-4 h-4 text-warning" />;
  };

  const statusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-warning/10 text-warning border-warning/20",
      accepted: "bg-success/10 text-success border-success/20",
      rejected: "bg-destructive/10 text-destructive border-destructive/20",
    };
    return (
      <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border", variants[status])}>
        {statusIcon(status)} {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gradient">MediCare</h1>
            <p className="text-sm text-muted-foreground">Welcome, {user?.fullName}</p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="book" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="book">Book Appointment</TabsTrigger>
            <TabsTrigger value="history">My Requests</TabsTrigger>
          </TabsList>

          {/* Book Appointment Tab */}
          <TabsContent value="book" className="space-y-6">
            {/* Doctors List */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-primary" /> Available Doctors
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {doctors.map((doc) => (
                  <Card key={doc.id} className={cn(
                    "cursor-pointer transition-all hover:shadow-md border-2",
                    selectedDoctor === doc.id ? "border-primary shadow-md" : "hover:border-primary/30"
                  )} onClick={() => setSelectedDoctor(doc.id)}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                          <Stethoscope className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{doc.full_name}</CardTitle>
                          <CardDescription>{doc.specialization}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" /> {doc.availability}
                      </p>
                    </CardContent>
                  </Card>
                ))}
                {doctors.length === 0 && (
                  <p className="text-muted-foreground col-span-full text-center py-8">No doctors available yet.</p>
                )}
              </div>
            </div>

            {/* Booking Form */}
            <Card>
              <CardHeader>
                <CardTitle>Request Appointment</CardTitle>
                <CardDescription>Fill in your details and select a preferred date</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitRequest} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Your Name</Label>
                      <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} required placeholder="Full name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Age</Label>
                      <Input type="number" value={patientAge} onChange={(e) => setPatientAge(e.target.value)} required min={1} max={150} placeholder="Age" />
                    </div>
                    <div className="space-y-2">
                      <Label>Preferred Time</Label>
                      <Select value={preferredTime} onValueChange={setPreferredTime}>
                        <SelectTrigger><SelectValue placeholder="Select time slot" /></SelectTrigger>
                        <SelectContent>
                          {["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"].map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Symptoms</Label>
                      <Textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} required placeholder="Describe your symptoms..." rows={4} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Preferred Date</Label>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date()}
                      className="rounded-md border pointer-events-auto"
                    />
                    <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={submitting || !selectedDoctor || !preferredTime}>
                      <Send className="w-4 h-4 mr-2" /> {submitting ? "Sending..." : "Send Request"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Appointment History</h2>
            {appointments.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No appointments yet.</CardContent></Card>
            ) : (
              appointments.map((apt) => (
                <Card key={apt.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Dr. {apt.doctors?.full_name}</span>
                          <Badge variant="secondary">{apt.doctors?.specialization}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{apt.symptoms}</p>
                        <p className="text-xs text-muted-foreground">
                          Requested: {format(new Date(apt.preferred_date), "PPP")} at {apt.preferred_time}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {statusBadge(apt.status)}
                        {apt.status === "accepted" && (
                          <div className="text-right">
                            <p className="text-sm font-medium text-success">Token #{apt.token_number}</p>
                            <p className="text-xs text-muted-foreground">Time: {apt.assigned_time}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
