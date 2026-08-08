import React from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Description from "./components/Description";
import DownloadApp from "./components/DownloadApp";
import Testimonials from "./components/Testimonials";
import Accordion from "./components/Accordion";
import Footer from "./components/Footer";

const homePage = () => {
  return (
    <div className="overflow-x-hidden">
      <Navbar />
      <Hero />
      <Description />
      <Testimonials />
      <DownloadApp />
      <Accordion />
      <Footer />
    </div>
  );
};

export default homePage;
