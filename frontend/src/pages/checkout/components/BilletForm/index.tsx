import { ChangeEvent, useEffect, useState } from "react"
import styles from "./styles.module.scss"
import { maskDocument } from "@/utils/masks"
import { FormInput } from "../FormInput"

const documentTypePlaceholder = {
    cpf: "000.000.000-00",
    cnpj: "00.000.000/0000-00"
}

export function BilletForm() {
    const [documentType, setDocumentType] = useState<"cpf" | "cnpj">("cpf")
    const [document, setDocument] = useState<string>("")

    const handleChangeDocument = (e: ChangeEvent<HTMLInputElement>) => {
        if(e.target.value === 'cpf' || e.target.value === "cnpj") {
            setDocumentType(e.target.value)
        }
    }

    const handleMaskInput = (e: ChangeEvent<HTMLInputElement>) => {
        const maskedValue = maskDocument(e.target.value)

        setDocument(maskedValue)
    }

    return (
        <div className={styles.container}>
            <div>
                <label htmlFor="billet_name">Gerar no nome de: </label>
                <FormInput type="text" id="billet_name" />
            </div>
            <div className={styles.documentTypeContainer}>

                <div className={styles.documentTypes}>
                    <p>Tipo do documento: </p>

                    <div>
                        <input 
                            type="radio"
                            id="cpf"
                            value="cpf"
                            name="document_type"
                            checked={documentType === "cpf"}
                            onChange={handleChangeDocument}
                        />
                        <label htmlFor="cpf">CPF</label>
                    </div>
                    <div>
                        <input 
                            type="radio"
                            id="cnpj"
                            value="cnpj"
                            name="document_type"
                            checked={documentType === "cnpj"}
                            onChange={handleChangeDocument}
                        />
                        <label htmlFor="cnpj">CNPJ</label>
                    </div>
                </div>

                <FormInput 
                    type="number" 
                    placeholder={documentTypePlaceholder[documentType]} 
                    maxLength={documentType === "cpf" ? 14 : 19}
                    value={document}
                    onChange={handleMaskInput}
                    />
            </div>
        </div>
    )
}