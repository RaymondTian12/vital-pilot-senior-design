"use client";

import React, { useState } from "react";
import Image from "next/image";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { FaCircleCheck } from "react-icons/fa6";

interface QuestionnaireData {
  firstName: string;
  lastName: string;
  date: string;
  gender: string;
  feet: number;
  inch: number;
  pound: number;

  stepGoal?: number;
  waterGoal?: number;
  sleepGoal?: number;
  weightGoal?: number;
  peakFlowGoal?: number;
}

type GoalField =
  | "stepGoal"
  | "waterGoal"
  | "sleepGoal"
  | "weightGoal"
  | "peakFlowGoal";

interface GoalConfig {
  vital: string;
  field: GoalField;
  question: string;
  unit: string;
  inputStep: string;
}

const GOAL_FIELDS: GoalConfig[] = [
  {
    vital: "physical_activity",
    field: "stepGoal",
    question: "What is your daily step goal?",
    unit: "steps per day",
    inputStep: "1",
  },
  {
    vital: "water_intake",
    field: "waterGoal",
    question: "What is your daily water intake goal?",
    unit: "mL per day",
    inputStep: "any",
  },
  {
    vital: "sleep_duration",
    field: "sleepGoal",
    question: "What is your daily sleep goal?",
    unit: "hours per night",
    inputStep: "any",
  },
  {
    vital: "chronic_obesity",
    field: "weightGoal",
    question: "What is your target weight?",
    unit: "lbs",
    inputStep: "any",
  },
  {
    vital: "peak_flow_rate",
    field: "peakFlowGoal",
    question: "What is your peak flow goal?",
    unit: "L/min",
    inputStep: "any",
  },
];

const Questionnaire = () => {
  const [step, setStep] = useState<number>(1);
  const [selectedVitals, setSelectedVitals] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    unregister,
    formState: { errors, isSubmitting },
  } = useForm<QuestionnaireData>({
    // Preserve answers when moving between steps.
    shouldUnregister: false,
  });

  const selectedGoals = GOAL_FIELDS.filter((goal) =>
    selectedVitals.includes(goal.vital),
  );

  const toggleVital = (vital: string) => {
    const removing = selectedVitals.includes(vital);

    if (removing) {
      const goal = GOAL_FIELDS.find((item) => item.vital === vital);

      if (goal) {
        // Remove the old answer and its validation error.
        unregister(goal.field);
      }
    }

    setSelectedVitals((previous) =>
      previous.includes(vital)
        ? previous.filter((item) => item !== vital)
        : [...previous, vital],
    );

    setIsComplete(false);
  };

  const isVitalSelected = (vital: string) => selectedVitals.includes(vital);

  const nextStep = async () => {
    if (isSubmitting || step >= 6) return;

    let isValid = false;

    switch (step) {
      case 1:
        isValid = await trigger(["firstName", "lastName"]);
        break;

      case 2:
        isValid = await trigger("date");
        break;

      case 3:
        isValid = await trigger("gender");
        break;

      case 4:
        isValid = await trigger(["feet", "inch", "pound"]);
        break;

      case 5:
        isValid = selectedVitals.length > 0;

        if (!isValid) {
          toast.error("Please select at least one vital.");
        }
        break;
    }

    if (isValid) {
      setStep((previous) => Math.min(previous + 1, 6));
    }
  };

  const previousStep = () => {
    if (isSubmitting) return;

    setIsComplete(false);
    setStep((previous) => Math.max(previous - 1, 1));
  };

  const onSubmit: SubmitHandler<QuestionnaireData> = async (data) => {
    if (step !== 6 || isComplete) return;

    if (selectedVitals.length === 0) {
      setStep(5);
      toast.error("Please select at least one vital.");
      return;
    }

    // Only include goals belonging to selected vitals.
    const goals: Partial<Record<GoalField, number>> = {};

    for (const goal of selectedGoals) {
      const value = data[goal.field];

      if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value <= 0 ||
        (goal.field === "stepGoal" && !Number.isInteger(value)) ||
        (goal.field === "sleepGoal" && value > 24)
      ) {
        toast.error("Please enter valid values for your selected goals.");
        return;
      }

      goals[goal.field] = value;
    }

    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
      date: data.date,
      gender: data.gender,
      feet: data.feet,
      inch: data.inch,
      pound: data.pound,
      selectedVitals: [...selectedVitals],
      goals,
    };

    try {
      // Replace this with your backend save request when available.
      // This preserves your current console-only submission behavior.
      console.log("Questionnaire data:", payload);

      setIsComplete(true);
      toast.success("Questionnaire completed!");
    } catch {
      toast.error("Failed to submit questionnaire.");
    }
  };

  return (
    <div className="relative flex flex-col items-center h-screen bg-linear-to-br from-[#f7fffc] via-white to-[#dff8ef]">
      <div className="flex-center gap-5 pt-7 border-b border-ai w-full pb-5 z-10 bg-white">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className={`w-[48px] h-[6px] rounded-full transition-all duration-300 ${
                step >= item ? "bg-main" : "bg-ai/40"
              }`}
            />
          ))}
        </div>

        <a href="/" className="drop-shadow-lg">
          <Image
            src="/assets/logo_green.png"
            alt="VitalPilot"
            width={30}
            height={30}
          />
        </a>
      </div>
      <div
        className="min-w-[700] min-h-[600] max-h-[600] shadow-[5px_5px_10px,-5px_-5px_10px] shadow-ai/50 rounded-2xl mt-7
        overflow-y-auto
        [&::-webkit-scrollbar]:w-[6px]
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-main/30
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb:hover]:bg-main/60
        [&::-webkit-scrollbar-button]:hidden bg-white"
      >
        <form
          noValidate
          onSubmit={(event) => {
            if (step !== 6) {
              event.preventDefault();
              void nextStep();
              return;
            }

            void handleSubmit(onSubmit)(event);
          }}
          className="flex flex-col"
        >
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
                type="button"
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
                <div className="flex flex-wrap gap-x-7 gap-y-3 w-[600px] m-x-auto mb-5 ">
                  <div
                    onClick={() => toggleVital("blood_glucose")}
                    className={`relative flex flex-col w-[180px] h-[140px] rounded-3xl border-2 pl-5 cursor-pointer transition
                    ${
                      isVitalSelected("blood_glucose")
                        ? "border-main bg-main/10"
                        : "border-ai hover:bg-ai/50"
                    }
                  `}
                  >
                    <Image
                      src="/assets/blood_glucose_questionnaire1.png"
                      alt=""
                      width={1000}
                      height={1000}
                      className="w-[100] h-[100] drop-shadow-2xl"
                    />
                    <p className="text-title font-semibold">Blood glucose</p>
                    {isVitalSelected("blood_glucose") && (
                      <FaCircleCheck className="absolute top-3 right-3 text-main text-xl" />
                    )}
                  </div>
                  <div
                    onClick={() => toggleVital("blood_oxygen")}
                    className={`relative flex flex-col w-[180px] h-[140px] rounded-3xl border-2 pl-5 cursor-pointer transition
                    ${
                      isVitalSelected("blood_oxygen")
                        ? "border-main bg-main/10"
                        : "border-ai hover:bg-ai/50"
                    }
                  `}
                  >
                    <Image
                      src="/assets/blood_oxygen_questionnaire1.png"
                      alt=""
                      width={1000}
                      height={1000}
                      className="w-[60] h-[60] drop-shadow-2xl mt-4 mb-6"
                    />
                    <p className="text-title font-semibold">Blood oxygen</p>
                    {isVitalSelected("blood_oxygen") && (
                      <FaCircleCheck className="absolute top-3 right-3 text-main text-xl" />
                    )}
                  </div>
                  <div
                    onClick={() => toggleVital("chronic_obesity")}
                    className={`relative flex flex-col w-[180px] h-[140px] rounded-3xl border-2 pl-5 cursor-pointer transition
                    ${
                      isVitalSelected("chronic_obesity")
                        ? "border-main bg-main/10"
                        : "border-ai hover:bg-ai/50"
                    }
                  `}
                  >
                    <Image
                      src="/assets/chronic_obesity_questionnaire.png"
                      alt=""
                      width={1000}
                      height={1000}
                      className="w-[100] h-[100] drop-shadow-2xl"
                    />
                    <p className="text-title font-semibold">Chronic obesity</p>
                    {isVitalSelected("chronic_obesity") && (
                      <FaCircleCheck className="absolute top-3 right-3 text-main text-xl" />
                    )}
                  </div>
                  <div
                    onClick={() => toggleVital("blood_pressure")}
                    className={`relative flex flex-col w-[180px] h-[140px] rounded-3xl border-2 pl-5 cursor-pointer transition
                    ${
                      isVitalSelected("blood_pressure")
                        ? "border-main bg-main/10"
                        : "border-ai hover:bg-ai/50"
                    }
                  `}
                  >
                    <Image
                      src="/assets/hypertension_questionnaire.png"
                      alt=""
                      width={1000}
                      height={1000}
                      className="w-[100] h-[100] drop-shadow-2xl"
                    />
                    <p className="text-title font-semibold">Blood pressure</p>
                    {isVitalSelected("blood_pressure") && (
                      <FaCircleCheck className="absolute top-3 right-3 text-main text-xl" />
                    )}
                  </div>
                  <div
                    onClick={() => toggleVital("peak_flow_rate")}
                    className={`relative flex flex-col w-[180px] h-[140px] rounded-3xl border-2 pl-5 pt-6 cursor-pointer transition
                    ${
                      isVitalSelected("peak_flow_rate")
                        ? "border-main bg-main/10"
                        : "border-ai hover:bg-ai/50"
                    }
                  `}
                  >
                    <Image
                      src="/assets/peak_flow_rate.png"
                      alt=""
                      width={1000}
                      height={1000}
                      className="w-[70] h-[50] drop-shadow-2xl mb-6"
                    />
                    <p className="text-title font-semibold">Peak flow rate</p>
                    {isVitalSelected("peak_flow_rate") && (
                      <FaCircleCheck className="absolute top-3 right-3 text-main text-xl" />
                    )}
                  </div>
                  <div
                    onClick={() => toggleVital("physical_activity")}
                    className={`relative flex flex-col w-[180px] h-[140px] rounded-3xl border-2 pl-5 cursor-pointer transition
                    ${
                      isVitalSelected("physical_activity")
                        ? "border-main bg-main/10"
                        : "border-ai hover:bg-ai/50"
                    }
                  `}
                  >
                    <Image
                      src="/assets/physical_activity_questionnaire.png"
                      alt=""
                      width={1000}
                      height={1000}
                      className="w-[100] h-[100] drop-shadow-2xl"
                    />
                    <p className="text-title font-semibold">
                      Physical activity
                    </p>
                    {isVitalSelected("physical_activity") && (
                      <FaCircleCheck className="absolute top-3 right-3 text-main text-xl" />
                    )}
                  </div>
                  <div
                    onClick={() => toggleVital("water_intake")}
                    className={`relative flex flex-col w-[180px] h-[140px] rounded-3xl border-2 pl-5 cursor-pointer transition
                    ${
                      isVitalSelected("water_intake")
                        ? "border-main bg-main/10"
                        : "border-ai hover:bg-ai/50"
                    }
                  `}
                  >
                    <Image
                      src="/assets/water_intake_questionnaire.png"
                      alt=""
                      width={1000}
                      height={1000}
                      className="w-[100] h-[100] drop-shadow-2xl"
                    />
                    <p className="text-title font-semibold">Water intake</p>
                    {isVitalSelected("water_intake") && (
                      <FaCircleCheck className="absolute top-3 right-3 text-main text-xl" />
                    )}
                  </div>
                  <div
                    onClick={() => toggleVital("sleep_duration")}
                    className={`relative flex flex-col w-[180px] h-[140px] rounded-3xl border-2 pl-5 cursor-pointer transition
                    ${
                      isVitalSelected("sleep_duration")
                        ? "border-main bg-main/10"
                        : "border-ai hover:bg-ai/50"
                    }
                  `}
                  >
                    <Image
                      src="/assets/sleep_duration_questionnaire.png"
                      alt=""
                      width={1000}
                      height={1000}
                      className="w-[100] h-[100] drop-shadow-2xl"
                    />
                    <p className="text-title font-semibold">Sleep duration</p>
                    {isVitalSelected("sleep_duration") && (
                      <FaCircleCheck className="absolute top-3 right-3 text-main text-xl" />
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-5">
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={selectedVitals.length === 0}
                    className="w-full h-[40px] rounded-full bg-amber-200 hover:bg-amber-300 cursor-pointer font-semibold transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>

                  {selectedVitals.length === 0 && (
                    <p role="status" className="text-sm text-red-500">
                      Select at least one vital to continue.
                    </p>
                  )}
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

          {step === 6 && (
            <div className="flex flex-col py-10 px-10">
              <h3 className="font-semibold mb-3">Set your personal goals</h3>

              {selectedGoals.length > 0 ? (
                <p className="text-sm text-gray-500 mb-8">
                  Enter a goal for each of the vitals you selected.
                </p>
              ) : (
                <p className="text-sm text-gray-500 mb-8">
                  Your selected vitals do not require goal values. Click
                  Complete to finish your questionnaire.
                </p>
              )}

              <fieldset
                disabled={isSubmitting || isComplete}
                className="flex flex-col gap-6"
              >
                {selectedGoals.map((goal) => {
                  const error = errors[goal.field];

                  return (
                    <div key={goal.field} className="flex flex-col">
                      <label htmlFor={goal.field} className="font-medium mb-2">
                        {goal.question}
                      </label>

                      <div className="flex items-center gap-3">
                        <input
                          id={goal.field}
                          type="number"
                          step={goal.inputStep}
                          inputMode={
                            goal.field === "stepGoal" ? "numeric" : "decimal"
                          }
                          placeholder="Enter your goal"
                          aria-invalid={Boolean(error)}
                          aria-describedby={`${goal.field}-unit${
                            error ? ` ${goal.field}-error` : ""
                          }`}
                          {...register(goal.field, {
                            valueAsNumber: true,
                            required: "Please enter your goal.",
                            validate: (value) => {
                              if (
                                typeof value !== "number" ||
                                !Number.isFinite(value) ||
                                value <= 0
                              ) {
                                return "Enter a number greater than zero.";
                              }

                              if (
                                goal.field === "stepGoal" &&
                                !Number.isInteger(value)
                              ) {
                                return "Enter a whole number of steps.";
                              }

                              if (goal.field === "sleepGoal" && value > 24) {
                                return "Sleep duration cannot exceed 24 hours.";
                              }

                              return true;
                            },
                          })}
                          className="min-w-0 w-[500px] h-[40px] border-2 border-ai outline-none focus:ring-3 focus:ring-main pl-2 rounded-lg"
                        />

                        <span
                          id={`${goal.field}-unit`}
                          className="text-sm text-gray-500 shrink-0"
                        >
                          {goal.unit}
                        </span>
                      </div>

                      {error && (
                        <p
                          id={`${goal.field}-error`}
                          role="alert"
                          className="text-red-500 text-sm mt-1"
                        >
                          {error.message}
                        </p>
                      )}
                    </div>
                  );
                })}
              </fieldset>


              <div className="flex flex-col gap-3 mt-8">
                <button
                  type="submit"
                  className="w-full h-[40px] rounded-full bg-amber-200 hover:bg-amber-300 cursor-pointer font-semibold transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? "Submitting..."
                    :"Complete"}
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
        </form>
      </div>
    </div>
  );
};

export default Questionnaire;
