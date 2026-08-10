import React from "react";
import TestimonialCard from "./TestimonialsCard";
const Testimonials = () => {
  return (
    <section className="h-180 flex-center flex-col w-[80%] mx-auto">
      <h3 className="font-fraunces font-medium drop-shadow-2xl">Testimonials</h3>
      <h2 className="text-3xl font-medium mb-8 drop-shadow-2xl">
        Hear from <span className="bg-linear-to-r from-[#BFD67C] via-[#58D78A] to-[#20a4b3]  bg-clip-text text-transparent">VitalPilot</span> users and see how it helps them{" "}
      </h2>
      <div className="flex-center gap-y-7 gap-x-10 flex-wrap">
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
