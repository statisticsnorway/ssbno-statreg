import { useEffect, useRef, useState } from 'react'

export function useVariantModal() {
  const [editVariantIndex, setEditVariantIndex] = useState<number | null>(null)
  const addVariantButtonRef = useRef<HTMLButtonElement>(null)
  const returnFocusToAddVariantButtonRef = useRef(false)
  const [variantModalCloseCount, setVariantModalCloseCount] = useState(0)

  useEffect(() => {
    if (!returnFocusToAddVariantButtonRef.current) return

    returnFocusToAddVariantButtonRef.current = false
    addVariantButtonRef.current?.focus()
  }, [variantModalCloseCount])

  function handleOpenCreateVariantModal() {
    setEditVariantIndex(null)
  }

  function handleOpenEditVariantModal(index: number) {
    setEditVariantIndex(index)
  }

  function handleVariantModalActionClose() {
    returnFocusToAddVariantButtonRef.current = true
  }

  function handleVariantModalClose() {
    setEditVariantIndex(null)
    setVariantModalCloseCount((count) => count + 1)
  }

  return {
    editVariantIndex,
    addVariantButtonRef,
    variantModalCloseCount,
    handleOpenCreateVariantModal,
    handleOpenEditVariantModal,
    handleVariantModalActionClose,
    handleVariantModalClose,
  }
}
