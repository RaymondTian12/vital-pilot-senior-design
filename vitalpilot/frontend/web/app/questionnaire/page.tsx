"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { FaCircleCheck } from "react-icons/fa6";

interface QuestionnaireData {
  firstName: string;
  lastName: string;
  date: string;
  gender: string;
  feet: string;
  inch: string;
  pound: string;
}

const Questionnaire = () => {
  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<QuestionnaireData>();

  const onSubmit: SubmitHandler<QuestionnaireData> = async (data) => {
    console.log(data);
    setStep((prev) => prev + 1);
    try {
      toast.success("Questionnaire completed!");
    } catch (error) {
      toast.error("Failed to submit questionnaire.");
    }
  };

  const [step, setStep] = useState<number>(1);
  const [selected, setSelected] = useState<boolean>(false);

  const nextStep = async () => {
    let isValid = false;

    if (step === 1) {
      isValid = await trigger(["firstName", "lastName"]);
    }

    if (step === 2) {
      isValid = await trigger("date");
    }

    if (step === 3) {
      isValid = await trigger("gender");
    }

    if (step === 4) {
      isValid = await trigger(["feet", "inch", "pound"]);
    }

    if (isValid) {
      setStep((prev) => prev + 1);
    }
  };

  const previousStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const selectedItems = () => {
    if (selected === false) {
      setSelected(true);
    } else {
      setSelected(false);
    }
  };

  return (
    <div className="flex flex-col items-center h-screen ">
      <div className="flex-center gap-5 mt-7 border-b border-ai w-full pb-5">
        <div className="flex gap-2">
          <div className="w-[50px] h-[7px] rounded-2xl bg-main" />

          <div
            className={`w-[50px] h-[7px] rounded-2xl ${
              step >= 2 ? "bg-main" : "bg-ai"
            }`}
          />

          <div
            className={`w-[50px] h-[7px] rounded-2xl ${
              step >= 3 ? "bg-main" : "bg-ai"
            }`}
          />

          <div
            className={`w-[50px] h-[7px] rounded-2xl ${
              step >= 4 ? "bg-main" : "bg-ai"
            }`}
          />

          <div
            className={`w-[50px] h-[7px] rounded-2xl ${
              step >= 5 ? "bg-main" : "bg-ai"
            }`}
          />
        </div>

        <a href="/" className="drop-shadow-lg">
          <Image
            src="/assets/logo_green1.png"
            alt="VitalPilot"
            width={30}
            height={30}
          />
        </a>
      </div>
      <div className="min-w-[700] min-h-[600] shadow-[5px_5px_10px,-5px_-5px_10px] shadow-ai/50 rounded-2xl mt-7">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
          {step === 1 && (
            <div className="flex flex-col py-10 px-10">
              <h3 className="font-semibold mb-10">
                What is your first and last name?
              </h3>
              <label htmlFor="firstName" className="mb-2">
                First name
              </label>
              <input
                type="text"
                id="firstName"
                autoComplete="given-name"
                placeholder="Enter your first name"
                {...register("firstName", {
                  required: "Please enter your first name",
                })}
                className="h-[40] border-2 border-ai outline-none focus:ring-3 focus:ring-main pl-2 rounded-lg mb-5"
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1 mb-5">
                  {errors.firstName.message}
                </p>
              )}
              {!errors.firstName && <div className="mb-5" />}
              <label htmlFor="lastName" className="mb-2">
                Last name
              </label>
              <input
                type="text"
                id="lastName"
                autoComplete="family-name"
                placeholder="Enter your last name"
                {...register("lastName", {
                  required: "Please enter your last name",
                })}
                className="h-[40] border-2 border-ai outline-none focus:ring-3 focus:ring-main pl-2 rounded-lg mb-5"
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.lastName.message}
                </p>
              )}

              <button
                className="h-[40] rounded-full bg-amber-200 hover:bg-amber-300 cursor-pointer mt-5 font-semibold transition duration-300"
                onClick={nextStep}
              >
                Next
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col py-10 px-10">
              <h3 className="font-semibold mb-10">
                What is your date of birth?
              </h3>
              <label htmlFor="date" className="mb-2">
                Date of birth
              </label>
              <div className="flex flex-col gap-x-2">
                <input
                  type="date"
                  id="date"
                  {...register("date", {
                    required: "Please enter your date of birth",
                  })}
                  className="w-full h-[40]  border-2 border-ai outline-none focus:ring-3 focus:ring-main pl-2 rounded-lg mb-5"
                />
                {errors.date && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.date.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3 mt-5">
                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full h-[40px] rounded-full bg-amber-200 hover:bg-amber-300 cursor-pointer font-semibold transition duration-300"
                >
                  Next
                </button>
                <button
                  type="button"
                  onClick={previousStep}
                  className="w-full h-[40px] rounded-full border-2 border-ai hover:bg-ai cursor-pointer font-semibold transition duration-300"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col">
              <div className="flex flex-col py-10 px-10">
                <h3 className="font-semibold mb-10">
                  What is your birth-assigned gender?
                </h3>
                <label htmlFor="firstName" className="mb-2">
                  Select your gender
                </label>
                <select
                  id="gender"
                  defaultValue=""
                  {...register("gender", {
                    required: "Please select your gender",
                  })}
                  className="h-[40] border-2 border-ai outline-none focus:ring-3 focus:ring-main pl-2 rounded-lg mb-5"
                >
                  <option value="" disabled>
                    Select your gender
                  </option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                {errors.gender && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.gender.message}
                  </p>
                )}

                <div className="flex flex-col gap-3 mt-5">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="w-full h-[40px] rounded-full bg-amber-200 hover:bg-amber-300 cursor-pointer font-semibold transition duration-300"
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    onClick={previousStep}
                    className="w-full h-[40px] rounded-full border-2 border-ai hover:bg-ai cursor-pointer font-semibold transition duration-300"
                  >
                    Back
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col">
              <div className="flex flex-col py-10 px-10">
                <h3 className="font-semibold mb-10">
                  What is your height and weight?
                </h3>
                <p className="mb-2">Height</p>
                <input
                  type="text"
                  id="feet"
                  placeholder="Feet (between 3 and 7)"
                  {...register("feet", {
                    required: "Please enter your height in feet",
                    valueAsNumber: true,
                    min: {
                      value: 3,
                      message: "Feet must be between 3 and 7",
                    },
                    max: {
                      value: 7,
                      message: "Feet must be between 3 and 7",
                    },
                  })}
                  className="h-[40px] border-2 border-ai outline-none focus:ring-3 focus:ring-main pl-2 rounded-lg"
                />

                {errors.feet && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.feet.message}
                  </p>
                )}

                <input
                  type="text"
                  id="inch"
                  placeholder="Inches (between 0 and 11)"
                  {...register("inch", {
                    required: "Please enter your height in inches",
                    valueAsNumber: true,
                    min: {
                      value: 0,
                      message: "Inches must be between 0 and 11",
                    },
                    max: {
                      value: 11,
                      message: "Inches must be between 0 and 11",
                    },
                  })}
                  className="h-[40px] border-2 border-ai outline-none focus:ring-3 focus:ring-main pl-2 rounded-lg mt-5"
                />

                {errors.inch && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.inch.message}
                  </p>
                )}

                <label htmlFor="pound" className="mb-2 mt-5">
                  Weight in pounds
                </label>

                <input
                  type="text"
                  id="pound"
                  placeholder="lbs"
                  {...register("pound", {
                    required: "Please enter your weight",
                    valueAsNumber: true,
                    min: {
                      value: 50,
                      message: "Weight must be at least 50 lbs",
                    },
                    max: {
                      value: 999,
                      message: "Weight must be below 1000 lbs",
                    },
                  })}
                  className="h-[40px] border-2 border-ai outline-none focus:ring-3 focus:ring-main pl-2 rounded-lg"
                />

                {errors.pound && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.pound.message}
                  </p>
                )}

                <div className="flex flex-col gap-3 mt-5">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="w-full h-[40px] rounded-full bg-amber-200 hover:bg-amber-300 cursor-pointer font-semibold transition duration-300"
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    onClick={previousStep}
                    className="w-full h-[40px] rounded-full border-2 border-ai hover:bg-ai cursor-pointer font-semibold transition duration-300"
                  >
                    Back
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col">
              <div className="flex flex-col py-10 px-10">
                <h3 className="font-semibold mb-10">
                  What kinds of vitals are you interested in?
                </h3>
                <div>
                  <div className="relative flex flex-col w-[180] h-[130] rounded-2xl border-2 border-ai pt-2 pl-5 cursor-pointer hover:bg-ai/50">
                    <Image
                      src="/assets/chronic_obesity_questionnaire.png"
                      alt=""
                      width={1000}
                      height={1000}
                      className="w-[80] h-[80] drop-shadow-2xl"
                    />
                    <p className="text-main font-medium">Chronic obesity</p>
                    <span
                      className="absolute bg-main"
                      onClick={() => selectedItems()}
                    >
                      {selected}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="h-[40] rounded-full bg-amber-200 hover:bg-amber-300 cursor-pointer mt-5 font-semibold transition duration-300"
                >
                  {isSubmitting ? "Sending" : "Complete"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Questionnaire;
