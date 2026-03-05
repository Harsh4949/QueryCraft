import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Database, ArrowRight, Zap } from "@/components/icons";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch("https://sql-ai-backend-hosted.onrender.com/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password,
                }),
            });
            if(response.status === 401) {
                alert("Invalid credentials");
                return;
            }

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("token", data.token);
                console.log("Login successful:", data.token);
                navigate("/dashboard");
            } else {
                alert(data.message || "Login failed");
            }
        } catch (err) {
            console.error("Login failed", err);
        }
    };
    
  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4 relative overflow-hidden">
      
      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 rounded-2xl bg-primary/5 animate-float" />
      <div className="absolute bottom-10 right-16 w-14 h-14 rounded-xl bg-accent/10 animate-float" style={{ animationDelay: "1s" }} />

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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Zap className="w-4 h-4" />
              Welcome Back
            </div>
            <h2 className="text-2xl font-heading font-bold text-foreground">
              Sign in to your account
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Continue learning SQL the smart way.
            </p>
          </div>

          <form className="space-y-5">
            
            <div>
              <label className="text-sm font-medium text-foreground">Username</label>
              <input
                type="text"
                name="username"
                onChange={handleChange}
                placeholder="John Doe"
                className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
            </div>      
                

            <div>
              <label className="text-sm font-medium text-foreground">Password</label>
              <input
                type="password"
                name="password"
                onChange={handleChange}
                placeholder="••••••••"
                className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground">
                <input type="checkbox" className="rounded border-border" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button variant="hero" size="lg" className="w-full" onClick={handleLogin}>
              Sign In
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground mt-6">
            Don’t have an account?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;