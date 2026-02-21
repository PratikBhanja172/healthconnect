import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Shield, Stethoscope, Users, ArrowRight, CalendarDays, Clock } from "lucide-react";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="gradient-hero text-primary-foreground">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="w-7 h-7" /> MediCare
          </h1>
          <Button
            variant="outline"
            className="border-primary-foreground/30 text-primary-foreground bg-transparent hover:bg-primary-foreground/10"
            onClick={() => navigate("/auth")}
          >
            Login / Register
          </Button>
        </nav>

        <div className="container mx-auto px-4 py-20 text-center max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Your Health, Our Priority
          </h2>
          <p className="text-lg md:text-xl opacity-90 mb-8">
            Book appointments with top specialists, track your medical history, and get the care you deserve — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8"
              onClick={() => navigate("/auth")}
            >
              Get Started <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              icon: Stethoscope,
              title: "Browse Doctors",
              desc: "Find specialists based on your needs and their availability.",
            },
            {
              icon: CalendarDays,
              title: "Book Appointment",
              desc: "Describe symptoms, pick a date and time, and send your request.",
            },
            {
              icon: Clock,
              title: "Get Your Token",
              desc: "Once approved, receive a token number and confirmed time slot.",
            },
          ].map((feature, i) => (
            <div key={i} className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
                <feature.icon className="w-8 h-8 text-primary-foreground" />
              </div>
              <h4 className="text-xl font-semibold">{feature.title}</h4>
              <p className="text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Portals */}
      <section className="bg-secondary py-20">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Choose Your Portal</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Users, label: "Patient", desc: "Book appointments and track your health journey" },
              { icon: Stethoscope, label: "Doctor", desc: "Manage your schedule and patient appointments" },
              { icon: Shield, label: "Admin", desc: "Oversee all appointments and system operations" },
            ].map((portal, i) => (
              <div
                key={i}
                className="bg-card rounded-xl p-8 text-center hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1"
                onClick={() => navigate("/auth")}
              >
                <div className="mx-auto w-14 h-14 rounded-full gradient-primary flex items-center justify-center mb-4">
                  <portal.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h4 className="text-lg font-semibold mb-2">{portal.label}</h4>
                <p className="text-sm text-muted-foreground">{portal.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 MediCare. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
