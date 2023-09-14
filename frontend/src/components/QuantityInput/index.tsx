import styles from './styles.module.scss'
import { Minus, Plus } from "phosphor-react";

interface QuantityInputProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
}

export function QuantityInput({
  onIncrease,
  onDecrease,
  quantity
}: QuantityInputProps) {
  
  
return (
    <div className={styles.container}>
      <button className={styles.iconWrapper} onClick={onDecrease} disabled={quantity <= 1}>
        <Minus size={14} weight="fill" />
      </button>
      <input type="number" readOnly value={quantity} min={1} />
      <button  className={styles.iconWrapper} onClick={onIncrease}>
        <Plus size={14} weight="fill" />
      </button>
    </div>
  );
}