import React from "react";
import Image from "next/image";
const DownloadApp = () => {
  return (
    <section
      className="bg-third h-[600] text-white flex rounded-4xl mt-10 overflow-hidden"
      id="download-app"
    >
      <div className="w-[80%] mx-auto flex-center">
        <div className="basis-1/2">
          <h1 className="text-white leading-none font-semibold drop-shadow-lg">
            Take VitalPilot with you
            <br />
            Stay connected
          </h1>

          <p className="text-white text-[18px] drop-shadow-md my-10 w-[70%] text-justify">
            Track your health metrics, review your trends, and stay connected to
            your health wherever you go. Download the VitalPilot app and keep
            your health information within reach.
          </p>

          <div className="flex gap-3 drop-shadow-2xl">
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

        <div className="relative basis-1/2 h-full drop-shadow-2xl  flex-center scale-110">
          <Image
            className="absolute left-15 top-3 mask-b-from-60%"
            src="/assets/iphone_download.png"
            alt="iphone image"
            width={700}
            height={200}
          />
        </div>
      </div>
    </section>
  );
};

export default DownloadApp;
