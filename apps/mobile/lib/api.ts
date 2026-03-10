import axios from "axios"
import { getAccessToken, saveAccessToken, getRefreshToken } from "../storage/secureStore"

export const api = axios.create({
  baseURL: "http://10.0.0.103:3000/api/v1"
})

/* ---------------- REQUEST INTERCEPTOR ---------------- */

api.interceptors.request.use(async (config) => {

  const token = await getAccessToken()

  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

/* ---------------- RESPONSE INTERCEPTOR ---------------- */

api.interceptors.response.use(
  (response) => response,
  async (error) => {

    if (error.response?.status === 401) {

      try {

        const refreshToken = await getRefreshToken()

        if (!refreshToken) throw error

        const response = await axios.post(
          "http://10.0.0.103:3000/api/v1/auth/refresh-token",
          { refreshToken }
        )

        const newAccessToken = response.data.accessToken

        await saveAccessToken(newAccessToken)

        error.config.headers.Authorization = `Bearer ${newAccessToken}`

        return api.request(error.config)

      } catch (refreshError) {
        throw refreshError
      }
    }

    throw error
  }
)