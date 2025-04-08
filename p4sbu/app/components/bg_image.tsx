export default function BGIMG({ url }: { url: string }) {
    return ( 
        <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${url}')`, opacity: 0.25 }}
        />
    );
}