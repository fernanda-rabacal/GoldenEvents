import { api } from "@/lib/axios"
import { GetServerSideProps, GetStaticPaths } from "next"

export default function UserProfile() {
    return <></>
}

// export const getStaticPaths: GetStaticPaths = async () => {
//     return {
//         paths: [],
//         fallback: 'blocking'
//       }
// }

export const getServerSideProps : GetServerSideProps = async ({ params }) => {
    const userId = String(params?.user_id)

    const user = await api.get(`/users/${userId}`)

    if (!user) {
        return {
          notFound: true,
        }
      }

    return {
        props: {}
    }
}