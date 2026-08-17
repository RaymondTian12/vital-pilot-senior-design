"use client";

import React from "react";
import { motion } from "framer-motion";
import { useState } from "react";
import accordion from "../faqs";
import { LuPlus } from "react-icons/lu";
import { LuMinus } from "react-icons/lu";
const Accordion = () => {
  const [clicked, setClicked] = useState<number | null>(null);

  const toggle = (i: number) => {
    if (clicked === i) {
      return setClicked(null);
    }
    setClicked(i);
  };

  return (
    <section className="flex-center mx-auto h-160 py-12 bg-[linear-gradient(180deg,rgba(0,0,0,0)_60%,rgba(205,231,127,0.7)_100%)]">
      <div className="flex justify-center w-[70%]">
        <h2 className="leading-none font-medium basis-2/5 ">
          Why{" "}
          <span className="text bg-linear-to-r from-[#BFD67C] via-[#58D78A] to-[#20a4b3] bg-clip-text text-transparent">
            VitalPilot
          </span>{" "}
          is <br /> Your Best Choice <br />
          for Everyday <br />
          Health Insights
        </h2>

        <div className="flex flex-col basis-3/5">
          {accordion.map((data, i) => (
            <div key={data.question} className="border-b border-gray-300">
              <div
                className="flex justify-between items-center cursor-pointer transition duration-300 w-full"
                onClick={() => toggle(i)}
              >
                <h3 className="font-semibold leading-tight basis-2/3 text-[20px] py-2">
                  {data.question}
                </h3>
                <span className="text-[25px] font-bold">
                  {clicked === i ? <LuMinus /> : <LuPlus />}
                </span>
              </div>

              <p
                className={
                  clicked === i
                    ? "font-semibold text-justify mb-3 overflow-hidden opacity-100 transition duration-300 ease max-h-full w-[80%]"
                    : "font-semibold text-justify mb-3 overflow-hidden opacity-0 ease max-h-0 w-[80%]"
                }
              >
                {data.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Accordion;




// "use client";

// import React, { useState } from "react";
// import Image from "next/image";

// import { useForm, type SubmitHandler } from "react-hook-form";
// import { toast } from "react-toastify";
// import { FaCircleCheck } from "react-icons/fa6";

// interface QuestionnaireData {
//   firstName: string;
//   lastName: string;
//   date: string;
//   gender: string;
//   feet: number;
//   inch: number;
//   pound: number;
// }

// const Questionnaire = () => {
//   const [step, setStep] = useState<number>(1);
//   const [selected, setSelected] = useState<boolean>(false);

//   const {
//     register,
//     handleSubmit,
//     trigger,
//     formState: { errors, isSubmitting },
//   } = useForm<QuestionnaireData>();


//   const selectedItems = () => {
//     setSelected((prev) => !prev);
//   };

//   const onSubmit: SubmitHandler<QuestionnaireData> = async (data) => {
//     try {
//       console.log(data);

//       toast.success("Questionnaire completed!");
//     } catch (error) {
//       console.error(error);
//       toast.error("Failed to submit questionnaire.");
//     }
//   };

//   return (
//     <div className="flex flex-col items-center min-h-screen">
//       {/* HEADER */}
//       <div className="flex-center gap-5 mt-7 border-b border-ai w-full pb-5">
//         <div className="flex gap-2">
//           <div className="w-[50px] h-[7px] rounded-2xl bg-main" />

//           <div
//             className={`w-[50px] h-[7px] rounded-2xl ${
//               step >= 2 ? "bg-main" : "bg-ai"
//             }`}
//           />

//           <div
//             className={`w-[50px] h-[7px] rounded-2xl ${
//               step >= 3 ? "bg-main" : "bg-ai"
//             }`}
//           />

//           <div
//             className={`w-[50px] h-[7px] rounded-2xl ${
//               step >= 4 ? "bg-main" : "bg-ai"
//             }`}
//           />

//           <div
//             className={`w-[50px] h-[7px] rounded-2xl ${
//               step >= 5 ? "bg-main" : "bg-ai"
//             }`}
//           />
//         </div>

//         <a href="/" className="drop-shadow-lg">
//           <Image
//             src="/assets/logo_green1.png"
//             alt="VitalPilot"
//             width={30}
//             height={30}
//           />
//         </a>
//       </div>

//       {/* QUESTIONNAIRE CARD */}
//       <div className="min-w-[700px] min-h-[600px] shadow-[5px_5px_10px,-5px_-5px_10px] shadow-ai/50 rounded-2xl mt-7">
//         <form onSubmit={handleSubmit(onSubmit)}>
//

//           {/* STEP 5 */}
//           {step === 5 && (
//             <div className="flex flex-col py-10 px-10">
//               <h3 className="font-semibold mb-10">
//                 What kinds of vitals are you interested in?
//               </h3>

//               <div>
//                 <div
//                   onClick={selectedItems}
//                   className={`relative flex flex-col w-[180px] h-[130px] rounded-2xl border-2 pt-2 pl-5 cursor-pointer transition
//                     ${
//                       selected
//                         ? "border-main bg-main/10"
//                         : "border-ai hover:bg-ai/50"
//                     }
//                   `}
//                 >
//                   <Image
//                     src="/assets/chronic_obesity_questionnaire.png"
//                     alt="Chronic obesity"
//                     width={1000}
//                     height={1000}
//                     className="w-[80px] h-[80px] drop-shadow-2xl"
//                   />

//                   <p className="text-main font-medium">
//                     Chronic obesity
//                   </p>

//                   {selected && (
//                     <FaCircleCheck className="absolute top-3 right-3 text-main text-xl" />
//                   )}
//                 </div>
//               </div>

//               <div className="flex gap-3 mt-5">
//                 <button
//                   type="button"
//                   onClick={previousStep}
//                   className="w-full h-[40px] rounded-full border-2 border-ai cursor-pointer font-semibold"
//                 >
//                   Back
//                 </button>

//                 <button
//                   type="submit"
//                   disabled={isSubmitting}
//                   className="w-full h-[40px] rounded-full bg-main text-white cursor-pointer font-semibold disabled:opacity-50"
//                 >
//                   {isSubmitting ? "Submitting..." : "Complete"}
//                 </button>
//               </div>
//             </div>
//           )}
//         </form>
//       </div>
//     </div>
//   );
// };

// export default Questionnaire;