type TitleProps = {
    label: string;
}

export default function PageTitle({label}: TitleProps) {
   return (
    <div>
        <h1>{label}</h1>
    </div>
   );
   
}