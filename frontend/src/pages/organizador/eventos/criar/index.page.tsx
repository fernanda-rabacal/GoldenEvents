import { AdminLayout } from "@/layouts/AdminLayout";
import styles from './styles.module.scss';
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import dynamic from "next/dynamic";
import 'suneditor/dist/css/suneditor.min.css'; 
import { Button } from "@/components/Button";
import Image from "next/image";
import { useState } from "react";

const SunEditor = dynamic(() => import("suneditor-react"), {
  ssr: false,
});

export default function CreateEvent() {
  const [photoSrc, setPhotoSrc] = useState("/images/photo-placeholder.jpg")

  return (
    <AdminLayout>
      <h2 className={styles.pageTitle}>Criar evento</h2>
      <form className={styles.container}>
        <div className={styles.formContainer}>
          <div className={styles.photoPreview}>
            <span>Imagem do evento (opcional)</span>
            <input type="file" id="photo" />

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
                options={[
                  'Teatro',
                  'Escola',
                  'Esportes',
                  'Negócios',
                  'Cursos'
                ]}
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
            <SunEditor height="300" />
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