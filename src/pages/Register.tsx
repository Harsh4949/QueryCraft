import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Database, ArrowRight, CheckCircle2 } from "@/components/icons";
import { useState } from "react";

//om@123
const Register = () => {
const [formData, setFormData] = useState({
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
});  
const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();

  if (formData.password !== formData.confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  try {
    const response = await fetch("https://sql-ai-backend-hosted.onrender.com/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: formData.username,
        password: formData.password,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("token", data.token);
      console.log("Registration successful!");
      navigate("/dashboard");  
    } else {
      alert(data.message || "Registration failed");
    }
  } catch (err) {
    console.error("Registration failed", err);
  }
};

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4 relative overflow-hidden">
      
      <div className="absolute top-24 right-10 w-20 h-20 rounded-2xl bg-primary/5 animate-float" />
      <div className="absolute bottom-12 left-16 w-14 h-14 rounded-xl bg-secondary/10 animate-float" style={{ animationDelay: "1s" }} />

      <div className="w-full max-w-md relative z-10">
        
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md gradient-primary flex items-center justify-center">
              <Database className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl text-foreground">
              Query<span className="text-primary">Craft</span>
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-hover p-8 animate-fade-in">
          
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-secondary/10 text-secondary text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Join QueryCraft
            </div>
            <h2 className="text-2xl font-heading font-bold text-foreground">
              Create your account
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Start mastering SQL today.
            </p>
          </div>

          <form className="space-y-5">
            
            <div>
              <label className="text-sm font-medium text-foreground">Username</label>
              <input
                type="text"
                placeholder="John Doe"
                name="username"
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                name="email"
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Password</label>
              <input
                type="password"
                placeholder="Create a strong password"
                name="password"
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Confirm Password</label>
              <input
                type="password"
                placeholder="Repeat your password"
                name="confirmPassword"
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
            </div>

            <Button variant="hero" size="lg" className="w-full" onClick={handleRegister}>
              Create Account
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;