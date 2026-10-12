import {
  createContext,
  useContext,
  useState,
  type PropsWithChildren,
} from "react";
const PreviewContext = createContext<{
  preview: boolean;
  setPreview: (enabled: boolean) => void;
}>({ preview: false, setPreview: () => {} });
// Deliberately session-only. The provider is keyed by the real authenticated account.
export function PreviewProvider({ children }: PropsWithChildren) {
  const [preview, setPreview] = useState(false);
  return (
    <PreviewContext.Provider value={{ preview, setPreview }}>
      {children}
    </PreviewContext.Provider>
  );
}
export const usePreview = () => useContext(PreviewContext);
