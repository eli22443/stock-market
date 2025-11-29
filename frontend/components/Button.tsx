"use client";

export default function Button({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={
        onClick
          ? onClick
          : () => {
              console.log("clicked");
            }
      }
    >
      {children}
    </button>
  );
}
