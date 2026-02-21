import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { LogOut, Users, CalendarDays, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
}

export default function DoctorDashboard() {
  const { user, signOut } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [doctorId, setDoctorId] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchDoctorId();
  }, [user]);

  useEffect(() => {
    if (doctorId) fetchAppointments();
  }, [doctorId, selectedDate]);

  const fetchDoctorId = async () => {
    if (!user) return;
    const { data } = await supabase.from("doctors").select("id").eq("user_id", user.id).single();
    if (data) setDoctorId(data.id);
  };

  const fetchAppointments = async () => {
    if (!doctorId) return;
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .eq("doctor_id", doctorId)
      .eq("status", "accepted")
      .eq("preferred_date", format(selectedDate, "yyyy-MM-dd"))
      .order("assigned_time", { ascending: true });
    if (data) setAppointments(data);
  };

  const totalToday = appointments.length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gradient">MediCare Doctor</h1>
            <p className="text-sm text-muted-foreground">Welcome, Dr. {user?.fullName}</p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" /> Select Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                className="rounded-md border pointer-events-auto"
              />
              <div className="mt-4 p-4 rounded-lg bg-secondary text-center">
                <p className="text-3xl font-bold text-primary">{totalToday}</p>
                <p className="text-sm text-muted-foreground">Patients on {format(selectedDate, "PPP")}</p>
              </div>
            </CardContent>
          </Card>

          {/* Patient List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Patients for {format(selectedDate, "PPP")}
            </h2>
            {appointments.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No patients scheduled for this date.</CardContent></Card>
            ) : (
              appointments.map((apt, idx) => (
                <Card key={apt.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                          #{apt.token_number}
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold">{apt.patient_name}</p>
                          <p className="text-sm text-muted-foreground">Age: {apt.patient_age}</p>
                          <p className="text-sm"><span className="font-medium">Symptoms:</span> {apt.symptoms}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium flex items-center gap-1 text-primary">
                          <Clock className="w-3 h-3" /> {apt.assigned_time}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
