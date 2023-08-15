import { getIsAuth } from "@/utils/getIsAuth";
import axios from "axios";

import Cookies from "js-cookie";

export const instance = axios.create({
  baseURL: "http://localhost:8080", // ONLY FOR DEV: comment this for production
  headers: {
    common: {
      Authorization: getIsAuth(),
    },
  },
});
