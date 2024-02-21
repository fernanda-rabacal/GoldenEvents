import { AdminLayout } from "@/layouts/AdminLayout";
import styles from './styles.module.scss';
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Button } from "@/components/Button";
import { ChangeEvent, useState } from "react";
import { GetStaticProps } from "next";
import { api } from "@/lib/axios";
import { RichTextEditor } from "@/components/RichTextEditor";

interface CreateEventPageProps {
  categories: {
    id: number,
    name: string
  }[]
}

export default function CreateEvent({ categories }: CreateEventPageProps) {
  const [photoSrc, setPhotoSrc] = useState("/images/photo-placeholder.jpg")

  const formattedCategories = categories?.map(category => ({
    key: category.id,
    value: category.name
  }))

  function handleUploadPhoto(e: ChangeEvent) {

  }

  return (
    <AdminLayout>
      <h2 className={styles.pageTitle}>Criar evento</h2>
      <form className={styles.container}>
        <div className={styles.formContainer}>
          <div className={styles.photoPreview}>
            <span>Imagem do evento (opcional)</span>
            <input type="file" id="photo" onChange={handleUploadPhoto} />

            <label htmlFor="photo">
              <img src={photoSrc} alt="photo preview" />
            </label>
          </div>

          <div className={styles.fields}>
            <Input
              id="name"
              label="Nome do evento *"
              />
            <Input
              id="location"
              label="Local do evento *"
              />
            <div className={styles.numberFields}>
              <Input
                id="capacity"
                type="number"
                label="Capacidade *"
                />
              <Input
                id="price"
                type="number"
                label="Preço *"
              />
            </div>

            <div>
              <span>Categoria do evento *</span>
              <Select 
                placeholder="Categoria"
                options={formattedCategories}
                onChangeSelect={(option) => { console.log( option )}}
              />
            </div>

            <div className={styles.datesFields}>
              <Input
                id="start_date"
                type="datetime-local"
                label="Data de início *"
                />
              <Input
                id="end_date"
                type="datetime-local"
                label="Data Final (opcional)"
              />
            </div>
          </div>
          
          <div className={styles.description}>
            <span>Descrição do Evento *</span>
            <RichTextEditor />
          </div>
        </div>

        <div className={styles.optionsBtn}>
          <Button type="button" colorType="white">
              Voltar
          </Button>
          <Button>
              Criar evento
          </Button>
        </div>
      </form>
    </AdminLayout>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const categoryData = await api.get("/events/categories")

  return {
    props: {
      categories: categoryData.data.categories
    }
  }
}