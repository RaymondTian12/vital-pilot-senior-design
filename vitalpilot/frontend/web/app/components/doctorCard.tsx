import React from "react";
import { MdOutlineVerifiedUser, MdLocationOn, MdPhone } from "react-icons/md";
import type { Doctor } from "../services/api";

interface DoctorCardProps {
  doctor: Doctor;
}

const DoctorCard = ({ doctor }: DoctorCardProps) => {
  return (
    <div className="flex items-center gap-4 border border-gray rounded-xl p-4 mb-4 bg-white">
      <div className="w-16 h-16 rounded-full bg-ai/30 flex-center text-secondary text-2xl font-bold shrink-0">
        {doctor.first_name?.[0]}
        {doctor.last_name?.[0]}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-[16px]">
            Dr. {doctor.first_name} {doctor.last_name}
          </h4>
          <MdOutlineVerifiedUser
            className="text-main text-[16px]"
            title="Verified via CMS NPI Registry"
          />
        </div>
        <p className="text-secondary font-semibold text-[14px] mb-2">
          {doctor.specialty}
        </p>

        {(doctor.city || doctor.state) && (
          <div className="flex items-center gap-1 text-[14px] text-gray-600">
            <MdLocationOn />
            <span>
              {doctor.address ? `${doctor.address}, ` : ""}
              {doctor.city}
              {doctor.city && doctor.state ? ", " : ""}
              {doctor.state}
            </span>
          </div>
        )}
        {doctor.phone && (
          <div className="flex items-center gap-1 text-[14px] text-gray-600">
            <MdPhone />
            <span>{doctor.phone}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorCard;
