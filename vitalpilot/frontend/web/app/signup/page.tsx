"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "react-toastify";

import { api } from "../services/api";

interface FormData {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Signup = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      await api.signUp(
        data.firstname,
        data.lastname,
        data.email,
        data.password
      );

      toast.success("Account created successfully!");
      reset();
      router.push("/dashboard");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create account."
      );
    }
  };

  return (
    <div className="relative flex-center gap-x-20 h-screen">
      <a
        href="/"
        className=" absolute drop-shadow-lg left-[80] -translate-x-1/2 top-10 -translate-y-1/2"
      >
        <Image
          src="/assets/logo_green.png"
          alt="Vitalpilot"
          width={50}
          height={50}
        />
      </a>
      <div className="absolute w-[400] h-[100] bg-linear-to-r from-main from-25% to-third to-50% left-1/2 -translate-x-1/2 top-20 -translate-y-1/2 -z-10 blur-[100px]" />
      <Image
        src="/assets/signup_pic.png"
        alt=""
        width={1537}
        height={1023}
        className="w-[500]"
      />
      <div className="w-[400]">
        <h3 className="text-[28px] font-bold leading-normal text-center mb-10 drop-shadow-2xl">
          Create your account to start tracking your health
        </h3>
        <form className="flex flex-col" onSubmit={handleSubmit(onSubmit)}>
          <input
            type="text"
            autoComplete="given-name"
            id="firstname"
            placeholder="First Name *"
            className="w-full h-[60] pl-5 outline-none rounded-lg border-2 border-gray focus:border-none focus:ring-3 focus:ring-main my-2"
            {...register("firstname", {
              required: "Please enter your first name.",
            })}
          />
          {errors.firstname && (
            <p className="error-message">{errors.firstname.message}</p>
          )}

          <input
            type="text"
            autoComplete="family-name"
            id="lastname"
            placeholder="Last Name *"
            className="w-full h-[60] pl-5 outline-none rounded-lg border-2 border-gray focus:border-none focus:ring-3 focus:ring-main my-2"
            {...register("lastname", {
              required: "Please enter your last name.",
            })}
          />
          {errors.lastname && (
            <p className="error-message">{errors.lastname.message}</p>
          )}

          <input
            type="email"
            autoComplete="email"
            id="email"
            placeholder="Email Address *"
            className="w-full h-[60] pl-5 outline-none rounded-lg border-2 border-gray focus:border-none focus:ring-3 focus:ring-main my-2"
            {...register("email", {
              required: "Please enter a Email.",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Please enter a valid email address.",
              },
            })}
          />
          {errors.email && (
            <p className="error-message">{errors.email.message}</p>
          )}

          <input
            type="password"
            autoComplete="new-password"
            id="password"
            placeholder="Password*"
            className="w-full h-[60] pl-5 outline-none rounded-lg border-2 border-gray focus:border-none focus:ring-3 focus:ring-main my-2"
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters",
              },

              pattern: {
                value:
                  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
                message:
                  "Password must contain an uppercase letter, lowercase letter, number, and special character",
              },
            })}
          />
          {errors.password && (
            <p className="error-message">{errors.password.message}</p>
          )}

          <input
            type="password"
            autoComplete="new-password"
            id="confirmPassword"
            placeholder="Confirm password*"
            className="w-full h-[60] pl-5 outline-none rounded-lg border-2 border-gray focus:border-none focus:ring-3 focus:ring-main my-2"
            {...register("confirmPassword", {
              required: "Please confirm your password",
              validate: (value, formValues) =>
                value === formValues.password || "Passwords do not match",
            })}
          />
          {errors.confirmPassword && (
            <p className="error-message">{errors.confirmPassword.message}</p>
          )}

          <button
            type="submit"
            className="w-full h-[60] pl-5 rounded-lg bg-main hover:bg-secondary my-5 cursor-pointer font-semibold transition duration-300"
            disabled={isSubmitting}
          >
            <p className="text-white">
              {isSubmitting ? "Sending..." : "Continue"}
            </p>
          </button>
          <div className="flex-center gap-2">
            <p>Already have an account?</p>
            <Link href="/signin" className="text-[16px] hover:underline">
              {" "}
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
