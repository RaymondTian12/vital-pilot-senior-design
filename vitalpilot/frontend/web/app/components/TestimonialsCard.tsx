import React from "react";

import { BiSolidQuoteAltLeft } from "react-icons/bi";
import { IoStar } from "react-icons/io5";

import Image from "next/image";

interface testimonial {
  text: string;
  name: string;
  img: any;
}

const TestimonialCard = ({ text, name, img }: testimonial) => {
  return (
    <div className="w-80 h-40">
      <div>
        <BiSolidQuoteAltLeft />
        <p>{text}</p>
      </div>
      <div>
        <Image
          src={img}
          alt="profile"
          width={1254}
          height={1254}
          className="w-20 h-20 rounded-full"
        />
        <div>
          <p>{name}</p>
          <div className="text">
            <IoStar />
            <IoStar />
            <IoStar />
            <IoStar />
            <IoStar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestimonialCard;
