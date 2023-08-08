// "use client";

import { axiosInstance } from "@/axiosInstance";
import { CMSData, InitialField } from "@/utils/interfaces";
import axios from "axios";
import i18next from "i18next";
import nextIntl, { useLocale } from "next-intl";
import { useRouter } from "next/navigation";


export const getHeroSectionData = async (locale: string) => {
  console.log("locale: ", locale)
  const heroData =
    await axiosInstance.get(
      `http://be-backoffice-srv/api/backoffice/sections/hero-section/fields/${locale}`
    ).then(res => res.data).catch(e => console.log("error: ", e)) as CMSData[]


  const Title = heroData[0].initialFields.find((item: InitialField) => item.fieldId === "hero-title")?.fieldValue
  const Description = heroData[0].initialFields.find((item: InitialField) => item.fieldId === "hero-description")?.fieldValue
  const Video = heroData[0].initialFields.find((item: InitialField) => item.fieldId === "hero-video")?.fieldValue


  return { Title, Description, Video };
};
