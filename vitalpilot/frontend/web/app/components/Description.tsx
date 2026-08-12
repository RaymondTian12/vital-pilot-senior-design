"use client";

import DescriptionDoctor from "./DescriptionComponent/DescriptionDoctor";
import DescriptionDashboard from "./DescriptionComponent/DescriptionDashboard";
import DescriptionChatbot from "./DescriptionComponent/DescriptionChatbot";


const Description = () => {
  return (
    <section className="w-[80%]  mx-auto my-10">
      
      <DescriptionChatbot />
      <DescriptionDashboard />
      <DescriptionDoctor />
    </section>
  );
};

export default Description;
