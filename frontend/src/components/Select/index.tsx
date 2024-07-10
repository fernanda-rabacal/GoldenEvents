import { useEffect, useState } from "react"
import styles from './styles.module.scss'
import { CaretDown, CaretUp } from "phosphor-react";
import { ErrorMessage } from "../ErrorMessage";

interface Option {
  key: string | number;
  value: string;
}

interface SelectProps {
  placeholder: string;
  options: Option[];
  error?: string;
  label?: string;
  defaultValue?: number;
  onChangeSelect: (optionKey: number | string) => void;
}

export function Select({ 
  placeholder, 
  options,
  onChangeSelect, 
  defaultValue, 
  error, 
  label 
}: SelectProps) {
  const [openList, setOpenList] = useState(false)
  const [selectPlaceholder, setSelectPlaceholder] = useState(() => {
    if (defaultValue) {
      const option = options.find(option => option.key === defaultValue)

      return option?.value
    }

     return placeholder
  })

  const optionsWithSelect = [
    {
      key: '',
      value: 'Selecione'
    },
    ...options
  ]

  function toggleOpenList() {
    setOpenList(prev => !prev)
  }

  function handleSelect(option: Option) {
    setSelectPlaceholder(option.value === 'Selecione' ? placeholder : option.value)

    toggleOpenList()

    onChangeSelect(option.key)
  }

  return (
    <div className={styles.container}>
      {label && <label>{label}</label>}

      <button type="button" className={styles.label} onClick={toggleOpenList} style={{ 
        color: selectPlaceholder !== placeholder ? "#202020" : ''
        }}>
        {selectPlaceholder}

        {openList ? <CaretUp color="#4e4e4e" /> : <CaretDown color="#4e4e4e" /> }
      </button>

      {
        openList && (
          <ul className={styles.list}>
            {optionsWithSelect.map(option => (
              <li 
                key={option.key} 
                onClick={() => handleSelect(option)} 
                className={`${label === option.value && styles.selectedOption}`}>
                {option.value}
              </li>
            ))}
          </ul>
        )
      }

      {error && <ErrorMessage>{error}</ErrorMessage>}
    </div>
  )
}