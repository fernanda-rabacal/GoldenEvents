import styles from './styles.module.scss'
import { api } from "@/lib/axios"
import { GetServerSideProps, GetStaticPaths } from "next"

interface User {
  id: string
  name: string
  email: string
  password: string
  cpf: string
}

interface PageProps {
  user: User
}

export default function UserProfile({ user } : PageProps) {
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
        props: {
          user
        }
    }
}