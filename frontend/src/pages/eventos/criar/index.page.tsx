import styles from './styles.module.scss'
import { useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from "zod"
import { Button } from '@/components/Button';

const newEventFormValidationSchema = z.object({
  name: z.string().min(1, "Informe o nome do evento"),
  start: z.string(),
  end: z.string(),
  description: z.string().min(1),
})

type NewEventFormData = z.infer<typeof newEventFormValidationSchema>

export default function CreateEvent() {
  const { register, handleSubmit, reset } = useForm<NewEventFormData>({
    resolver: zodResolver(newEventFormValidationSchema)
  });

  function handleCreateNewEvent(data: NewEventFormData) {    
       
  }

  return (
    <main className={styles.container}>
      <h1>Crie aqui seu evento</h1>

      <form className={styles.createForm} onSubmit={handleSubmit(handleCreateNewEvent)}>
        <div>
            <label htmlFor='name'>Nome do Evento</label>
              <input 
                id='name' 
                type="text" 
                placeholder='Insira o nome do evento' 
                required 
                {...register("name")}
              />
          </div>

          <div className={styles.hoursContainer}>
            <div>
              <label htmlFor='start'>Data e Hora de Início</label>      
                  <input 
                    type="datetime-local" 
                    id="start"
                    required
                    {...register("start")}
                  />
            </div>
            <div>
              <label htmlFor='end'>Data de conclusão</label>
                  <input 
                    type="datetime-local" 
                    id="end"
                    required 
                    {...register("end")}
                  />
            </div>
          </div>

          <div>
            <label htmlFor='description'> Descrição</label>
            <textarea 
              placeholder='Descreva...' 
              id="description" 
              required 
              {...register("description")}
              > 
            </textarea>
        </div>
      
        <Button type="submit">
            Criar Evento
        </Button> 
      </form>
    </main>
  )
}