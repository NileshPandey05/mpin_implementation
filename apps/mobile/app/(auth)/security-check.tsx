import { View, Text } from "react-native"
import { useEffect, useState } from "react"
import { router } from "expo-router"
import { runDeviceSecurityCheck } from "@/security/deviceSecurity"


export default function SecurityCheckScreen() {

  const [issues,setIssues] = useState<string[]>([])
  const [loading,setLoading] = useState(true)

  useEffect(()=>{

    async function check(){

      const result = await runDeviceSecurityCheck()

      if(result.safe){
        router.replace("/register-device")
      }else{
        setIssues(result.issues)
      }

      setLoading(false)
    }

    check()

  },[])

  if(loading){
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Checking device security...</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 justify-center px-6 bg-white">

      <Text className="text-2xl font-bold mb-6">
        Device Not Secure
      </Text>

      {issues.map((issue,index)=>(
        <Text key={index} className="text-red-500 mb-2">
          • {issue}
        </Text>
      ))}

      <Text className="mt-6 text-gray-500">
        Please use a secure device to continue.
      </Text>

    </View>
  )
}