import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import courseMockup from "@/assets/course-mockup.jpg";

const steps = [
  {
    number: "01",
    title: "Input Your Requirements",
    description: "Tell us your course topic, target audience, desired length, and learning style preferences."
  },
  {
    number: "02", 
    title: "AI Generates Your Course",
    description: "Our advanced AI creates a comprehensive course with modules, sections, and learning objectives."
  },
  {
    number: "03",
    title: "Edit & Customize",
    description: "Use our built-in editor to refine content, add your expertise, and personalize the course."
  },
  {
    number: "04",
    title: "Download & Deploy",
    description: "Export in your preferred format (PDF, DOCX, TXT) and start teaching immediately."
  }
];

const HowItWorks = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left side - Steps */}
          <div>
            <div className="mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                How It
                <span className="block bg-gradient-accent bg-clip-text text-transparent">
                  Actually Works
                </span>
              </h2>
              <p className="text-xl text-muted-foreground">
                From idea to complete course in just four simple steps. 
                Our AI handles the heavy lifting while you focus on your expertise.
              </p>
            </div>

            <div className="space-y-8">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-6 group">
                  {/* Step number */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center font-bold text-accent-foreground shadow-medium">
                      {step.number}
                    </div>
                    {index < steps.length - 1 && (
                      <div className="w-px h-16 bg-border ml-6 mt-4" />
                    )}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 pb-8">
                    <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-accent transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Arrow connector */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block flex-shrink-0 pt-6">
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Course mockup */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-accent/10 rounded-2xl blur-3xl transform scale-110" />
            <Card className="relative p-8 shadow-strong bg-gradient-card border-border/50">
              <img
                src={courseMockup}
                alt="Generated Course Example"
                className="w-full rounded-xl shadow-medium"
              />
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-success rounded-full" />
                  <span className="text-sm text-muted-foreground">Course generated in 2.3 minutes</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-accent rounded-full" />
                  <span className="text-sm text-muted-foreground">12 modules, 47 sections, 156 pages</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-warning rounded-full" />
                  <span className="text-sm text-muted-foreground">Ready for download in PDF, DOCX, TXT</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;