import { Card } from "@/components/ui/card";
import { 
  Zap, 
  Download, 
  Edit3, 
  Shield, 
  Clock, 
  Target,
  Users,
  Sparkles
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "AI-Powered Generation",
    description: "Advanced AI creates comprehensive courses tailored to your specifications in minutes."
  },
  {
    icon: Download,
    title: "Multiple Export Formats",
    description: "Download your courses in PDF, DOCX, or TXT formats for maximum flexibility."
  },
  {
    icon: Edit3,
    title: "Built-in Course Editor",
    description: "Edit, refine, and customize every aspect of your generated courses with our intuitive editor."
  },
  {
    icon: Shield,
    title: "Professional Quality",
    description: "Each course includes structured modules, learning objectives, and assessment guidelines."
  },
  {
    icon: Clock,
    title: "Save Time",
    description: "Create courses in minutes instead of weeks. Focus on teaching, not course creation."
  },
  {
    icon: Target,
    title: "Audience Targeting",
    description: "Generate content specifically tailored to your target audience's skill level and needs."
  },
  {
    icon: Users,
    title: "CRM Dashboard",
    description: "Manage all your courses from a centralized dashboard with analytics and insights."
  },
  {
    icon: Sparkles,
    title: "Resell & Repurpose",
    description: "Use generated courses for your business, training programs, or educational content."
  }
];

const Features = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Everything You Need to Create
            <span className="block bg-gradient-accent bg-clip-text text-transparent">
              Professional Courses
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our comprehensive platform provides all the tools and features you need 
            to generate, edit, and manage high-quality educational content.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="p-6 text-center hover:shadow-medium transition-all duration-300 hover:-translate-y-1 bg-gradient-card border-border/50"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-accent rounded-lg mb-4">
                  <Icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;