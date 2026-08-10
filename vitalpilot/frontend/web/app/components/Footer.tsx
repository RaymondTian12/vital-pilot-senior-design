import React from "react";
import { IoIosCheckmarkCircle } from "react-icons/io";
import Image from "next/image";
const Footer = () => {
  let currentYear = new Date().getFullYear();
  return (
    <section className="relative bg-footer h-90">
      <div className="flex items-start justify-around w-[90%] pt-10 h-full m-auto">
        <div className="relative basis-3/7 h-ful">
          <Image
            className="absolute -left-5 -top-4 drop-shadow-4xl"
            src="/assets/logo_footer.png"
            alt="VitalPilot Logo"
            width={300}
            height={400}
          />
          <div className="absolute left-0 top-25 drop-shadow-2xl">
            <p className="text-white text-[25px] drop-shadow-lg mb-2">
              Download Our App
            </p>
            <div className="flex gap-3">
              <a href="">
                <Image
                  className="drop-shadow-lg"
                  src="/assets/mobile-ios.png"
                  alt="ios logo"
                  width={170}
                  height={100}
                />
              </a>
              <a href="">
                <Image
                  className="drop-shadow-lg"
                  src="/assets/mobile-google-play.png"
                  alt="google play logo"
                  width={170}
                  height={100}
                />
              </a>
            </div>
          </div>
        </div>

        <div className="basis-1/7">
          <h4 className="text-third">Website</h4>
          <ul>
            <li>
              <a href="#" className="text-white hover:underline">
                Home
              </a>
            </li>
            <li>
              <a href="#" className="text-white hover:underline">
                Description
              </a>
            </li>
          </ul>
        </div>

        <div className="basis-1/7">
          <h4 className="text-third">Resources</h4>
          <ul>
            <li>
              <a href="#" className="text-white hover:underline">
                Pilot AI
              </a>
            </li>
            <li>
              <a href="#" className="text-white hover:underline">
                Doctors
              </a>
            </li>
            <li>
              <a href="#" className="text-white hover:underline">
                Dashboard
              </a>
            </li>
          </ul>
        </div>

        <div className="relative basis-2/7 bg-amber-300 z-2">
          <Image
            className="absolute -top-7 -right-2 drop-shadow-2xl"
            src="/assets/hipaa_footer.png"
            alt="ios logo"
            width={320}
            height={100}
          />
          <ul className="absolute left-35 top-38 font-medium drop-shadow-2xl">
            <li className="flex gap-1 items-center text-white">
              <IoIosCheckmarkCircle className="text-white text-[22px]" /> HIPAA
              Compliant
            </li>
            <li className="flex gap-1 items-center text-white">
              <IoIosCheckmarkCircle className="text-white text-[22px]" /> Secure
              Data
            </li>
            <li className="flex gap-1 items-center text-white">
              <IoIosCheckmarkCircle className="text-white text-[22px]" />{" "}
              Privacy Protection
            </li>
          </ul>
        </div>
      </div>
      <p className="absolute left-1/2 -translate-x-1/2 bottom-4 text-white font-medium">
        © {currentYear} VitalPilot. All rights reserved.
      </p>
    </section>
  );
};

export default Footer;
