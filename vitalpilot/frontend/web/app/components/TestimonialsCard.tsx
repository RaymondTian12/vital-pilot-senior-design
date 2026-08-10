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
    <div
      className="w-100 font-semibold py-5 px-5 drop-shadow-2xl rounded-2xl 
    bg-[radial-gradient(ellipse_at_bottom,#ffffff_50%,#ebf1ff_80%,#c0f8e7_100%)]
    transition-all duration-300 ease-in-out hover:scale-105"
    >
      <div className="relative flex justify-center gap-x-2 mb-5 drop-shadow-2xl">
        <BiSolidQuoteAltLeft className="w-30 h-20 -translate-y-4 drop-shadow-2xl text-main" />
        <p className=" text-[18px] font-[Georgia] font-medium drop-shadow-2xl">
          {text}
        </p>
      </div>
      <div className="flex gap-x-3 items-center">
        <Image
          src={img}
          alt="profile"
          width={1254}
          height={1254}
          className="w-20 h-20 rounded-full drop-shadow-lg"
        />
        <div>
          <p>{name}</p>
          <div className="text-amber-300 flex">
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
