import { useState } from "react"
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
  onChangeSelect: (optionKey: number | string) => void;
}


export function Select({ placeholder, options, onChangeSelect, error, label }: SelectProps) {
  const[openList, setOpenList] = useState(false)
  const[selectPlaceholder, setSelectPlaceholder] = useState(placeholder)
  const[optionChanged, setOptionChanged] = useState(false); 

  function toggleOpenList() {
    setOpenList(prev => !prev)
  }

  function handleSelect(option: Option) {
    setSelectPlaceholder(option.value)

    toggleOpenList()

    onChangeSelect(option.key)
    setOptionChanged(true)
  }

  return (
    <div className={styles.container}>
      {label && <label>{label}</label>}

      <button type="button" className={styles.label} onClick={toggleOpenList} style={{ color: optionChanged ? "#202020" : ''}}>
        {selectPlaceholder}

        {openList ? <CaretUp color="#4e4e4e" /> : <CaretDown color="#4e4e4e" /> }
      </button>

      {
        openList && (
          <ul className={styles.list}>
            {options.map(option => (
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