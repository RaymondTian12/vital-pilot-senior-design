"use client";

import DescriptionDoctor from "./DescriptionComponent/DescriptionDoctor";
import DescriptionDashboard from "./DescriptionComponent/DescriptionDashboard";
import DescriptionChatbot from "./DescriptionComponent/DescriptionChatbot";


const Description = () => {
  return (
    <section className="w-[80%]  mx-auto pt-10 mb-15">
      
      <DescriptionChatbot />
      <DescriptionDashboard />
      <DescriptionDoctor />
    </section>
  );
};

export default Description;
