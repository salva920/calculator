# Validación de Comprobantes P2P

Esta funcionalidad te permite validar que el monto del comprobante de transferencia coincida con el monto de la orden de Binance P2P.

## Características

- **Subida de imágenes**: Sube el comprobante de transferencia desde tu dispositivo
- **OCR automático**: Extrae automáticamente el monto de la imagen usando reconocimiento óptico de caracteres
- **Validación manual**: Si el OCR no funciona, puedes ingresar el monto manualmente
- **Historial de validaciones**: Guarda un registro de todas las validaciones realizadas

## Cómo usar

1. En la tabla de "Transacciones Sincronizadas", busca una transacción de tipo **Compra**
2. Haz clic en el ícono de verificación (✓) junto al estado de la transacción
3. Selecciona la imagen del comprobante de transferencia
4. El sistema intentará extraer el monto automáticamente usando OCR
5. Si el OCR no funciona, puedes ingresar el monto manualmente
6. El sistema comparará el monto con el esperado y te mostrará si coincide

## Instalación de OCR (Opcional)

Para habilitar el reconocimiento automático de texto (OCR), instala Tesseract.js:

```bash
npm install tesseract.js
```

**Nota**: Tesseract.js es una librería pesada (~50MB). Si no la instalas, siempre podrás ingresar el monto manualmente.

## Alternativas de OCR

Para mejor precisión en producción, considera usar:

- **Google Cloud Vision API**: Alta precisión, requiere cuenta de Google Cloud
- **AWS Textract**: Excelente para documentos estructurados
- **Azure Computer Vision**: Buena alternativa de Microsoft

## Estructura de datos

Las validaciones se guardan en la colección `receipt_validations` con:

- `transactionId`: ID de la transacción relacionada
- `imageUrl`: URL de la imagen del comprobante
- `extractedAmount`: Monto extraído de la imagen
- `expectedAmount`: Monto esperado de la orden
- `isValid`: Si el monto coincide
- `confidence`: Nivel de confianza del OCR (0-1)
- `ocrText`: Texto completo extraído por OCR

## Tolerancia

El sistema permite una diferencia de hasta **1 VES** entre el monto detectado y el esperado para considerar la validación como exitosa.





