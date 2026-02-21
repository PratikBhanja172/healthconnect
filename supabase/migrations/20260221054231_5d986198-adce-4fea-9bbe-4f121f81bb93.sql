
-- Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'doctor', 'patient');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'patient',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- User roles table (for security-definer role checks)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Doctors table
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  availability TEXT NOT NULL DEFAULT 'Mon-Fri 9AM-5PM',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view doctors" ON public.doctors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Doctors can update own profile" ON public.doctors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage doctors" ON public.doctors FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_name TEXT NOT NULL,
  patient_age INT NOT NULL,
  symptoms TEXT NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  token_number INT,
  assigned_time TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own appointments" ON public.appointments FOR SELECT USING (auth.uid() = patient_user_id);
CREATE POLICY "Patients can create appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = patient_user_id);
CREATE POLICY "Admins can view all appointments" ON public.appointments FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update appointments" ON public.appointments FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Doctors can view their appointments" ON public.appointments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.doctors WHERE doctors.id = appointments.doctor_id AND doctors.user_id = auth.uid())
);

-- Function to auto-create profile and role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role app_role;
  _name TEXT;
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'patient');
  _name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'User');
  
  INSERT INTO public.profiles (user_id, full_name, role) VALUES (NEW.id, _name, _role);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  
  IF _role = 'doctor' THEN
    INSERT INTO public.doctors (user_id, full_name, specialization)
    VALUES (NEW.id, _name, COALESCE(NEW.raw_user_meta_data->>'specialization', 'General'));
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Admin read access to profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
