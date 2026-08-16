"use client";

import React, { useState } from "react";
import Image from "next/image";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";

interface QuestionnaireData {
  firstName: string;
  lastName: string;
  date: any;
  gender: string
  feet: number
  inch: number
  pound: number
}

const Questionnaire = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<QuestionnaireData>();

  const onSubmit: SubmitHandler<QuestionnaireData> = async (data) => {
    console.log(data);
    setStep((prev) => prev + 1);
    try {
      toast.success("Welcome back!");
    } catch (error) {
      toast.error("Failed to sign in.");
    }
  };

  const [step, setStep] = useState<number>(1);
  const [selected, setSelected] = useState(false)

  return (
    <div className="flex flex-col items-center h-screen ">
      <div className="flex-center gap-5 mt-7 border-b border-ai w-full pb-5">
        <div className="flex gap-2">
          <div className="w-[50] h-[7] rounded-2xl bg-ai"></div>
          <div className="w-[50] h-[7] rounded-2xl bg-ai"></div>
          <div className="w-[50] h-[7] rounded-2xl bg-ai"></div>
          <div className="w-[50] h-[7] rounded-2xl bg-ai"></div>
          <div className="w-[50] h-[7] rounded-2xl bg-ai"></div>
          <div className="w-[50] h-[7] rounded-2xl bg-ai"></div>
        </div>
        <a href="" className="drop-shadow-lg ">
          <Image
            src="/assets/logo_green1.png"
            alt="Vitalpilot"
            width={30}
            height={30}
          />
        </a>
      </div>
      <div className="min-w-[700] min-h-[650] shadow-[5px_5px_10px,-5px_-5px_10px] shadow-ai/50 rounded-2xl mt-7">
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
                <p className="">{errors.firstName.message}</p>
              )}

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
              {errors.lastName && <p className="">{errors.lastName.message}</p>}

              <button
                className="h-[40] rounded-full bg-amber-200 hover:bg-amber-300 cursor-pointer mt-5 font-semibold transition duration-300"
                onClick={() => setStep((prev) => prev + 1)}
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
              <div className="flex gap-x-2">
                <input
                  type="date"
                  id="date"
                  autoComplete=""
                  {...register("lastName", {
                    required: "Please enter your date of birth",
                  })}
                  className="w-full h-[40]  border-2 border-ai outline-none focus:ring-3 focus:ring-main pl-2 rounded-lg mb-5"
                />
                {errors.lastName && (
                  <p className="">{errors.lastName.message}</p>
                )}
              </div>

              <button
                className="h-[40] rounded-full bg-amber-200 hover:bg-amber-300 cursor-pointer mt-5 font-semibold transition duration-300"
                onClick={() => setStep((prev) => prev + 1)}
              >
                Next
              </button>
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
                  id="selectGender"
                  defaultValue=""
                  className="h-[40] border-2 border-ai outline-none focus:ring-3 focus:ring-main pl-2 rounded-lg mb-5"
                >
                  <option value="" disabled>
                    Select your gender
                  </option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>

                <button
                  className="h-[40] rounded-full bg-amber-200 hover:bg-amber-300 cursor-pointer mt-5 font-semibold transition duration-300"
                  onClick={() => setStep((prev) => prev + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col">
              <div className="flex flex-col py-10 px-10">
                <h3 className="font-semibold mb-10">
                  What is your height and weight?
                </h3>
                <p className="mb-2">
                  Height
                </p>
                <input
                  type="text"
                  id="feet"
                  autoComplete=""
                  placeholder="feet"
                  {...register("feet", {
                    required: "Invalid entry. Please enter a whole number between 3 and 7 feet.",
                  })}
                  className="h-[40] border-2 border-ai outline-none focus:ring-3 focus:ring-main pl-2 rounded-lg mb-5"
                />
                {errors.firstName && (
                  <p className="">{errors.firstName.message}</p>
                )}

                <input
                  type="text"
                  id="inch"
                  autoComplete=""
                  placeholder="inch(es)"
                  {...register("inch", {
                    required: "Invalid entry. Please enter a whole number between 0 and 11 inches.",
                  })}
                  className="h-[40] border-2 border-ai outline-none focus:ring-3 focus:ring-main pl-2 rounded-lg mb-5"
                />
                {errors.firstName && (
                  <p className="">{errors.firstName.message}</p>
                )}

                <label htmlFor="lastName" className="mb-2">
                  Weight in pounds
                </label>
                <input
                  type="text"
                  id="pound"
                  autoComplete=""
                  placeholder="lbs"
                  {...register("pound", {
                    required: "Invalid entry. Please enter a weight between 100 and 999 pounds.",
                  })}
                  className="h-[40] border-2 border-ai outline-none focus:ring-3 focus:ring-main pl-2 rounded-lg mb-5"
                />
                {errors.lastName && (
                  <p className="">{errors.lastName.message}</p>
                )}

                <button
                  className="h-[40] rounded-full bg-amber-200 hover:bg-amber-300 cursor-pointer mt-5 font-semibold transition duration-300"
                  onClick={() => setStep((prev) => prev + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
          {step === 5 && (
            <div className="flex flex-col">
              <div className="flex flex-col py-10 px-10">
                <h3 className="font-semibold mb-10">
                  What kinds of vitals are you interested in?
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
                  <p className="">{errors.firstName.message}</p>
                )}

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
                  <p className="">{errors.lastName.message}</p>
                )}

                <button
                  className="h-[40] rounded-full bg-amber-200 hover:bg-amber-300 cursor-pointer mt-5 font-semibold transition duration-300"
                  onClick={() => setStep((prev) => prev + 1)}
                >
                  Next
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
