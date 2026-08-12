import React from "react";
import TestimonialCard from "./TestimonialsCard";
import Image from "next/image";


const Testimonials = () => {
  return (
    <section className="flex items-center flex-col w-[80%] mx-auto mb-20">
      <h3 className="font-[Georgia] font-medium shadow-2xl border-none rounded-full mb-3 px-4 bg-ai w-fit">
        Testimonials
      </h3>
      <h2 className="relative text-3xl text-center font-semibold mb-4 drop-shadow-2xl leading-none">
        Hear from{" "}
        <span className="bg-linear-to-r from-[#BFD67C] via-[#58D78A] to-[#20a4b3]  bg-clip-text text-transparent">
          VitalPilot
        </span>{" "}
        users and <Image src="/assets/testimonial_icon.png" alt="icon" width={1200} height={1200} className="absolute -top-7 -right-18 w-20 h-20"/><br />
        see how it helps them{" "}
      </h2>
      <h4 className="text-center text-gray-500 font-semibold leading-6 mb-7">
        Real experiences from people using VitalPilot<br/> to stay informed, take
        control, and live healthier{" "}
      </h4>
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
