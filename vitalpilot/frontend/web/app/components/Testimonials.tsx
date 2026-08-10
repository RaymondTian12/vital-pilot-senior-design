import React from "react";
import TestimonialCard from "./TestimonialsCard";
const Testimonials = () => {
  return (
    <section className="h-130 bg-gray-100 flex-center flex-col w-[80%] mx-auto">
      <h3 className="font-fraunces">Testimonials</h3>
      <h2 className="text-3xl font-medium mb-8">
        Hear from VitalPilot users and see how it helps them{" "}
      </h2>
      <div className="flex-center gap-2">
        <TestimonialCard
          text="VitalPilot makes it much easier for me to understand my health trends without feeling overwhelmed."
          name="Daniel Chen"
          img="/assets/testimonial_1.png"
        />
        <TestimonialCard
          text="I like having my health information organized in one place and easy to review anytime."
          name="Sarah Johnson"
          img="/assets/testimonial_2.png"
        />
        <TestimonialCard
          text="VitalPilot helps me feel more prepared when I talk with my healthcare provider about my health."
          name="Michael Brown"
          img="/assets/testimonial_3.png"
        />
        <TestimonialCard
          text="Tracking my daily health has become much simpler, and I can actually see how things change."
          name="James Walker"
          img="/assets/testimonial_4.png"
        />
      </div>
    </section>
  );
};

export default Testimonials;
