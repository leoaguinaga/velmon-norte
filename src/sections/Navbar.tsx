import React, { useState } from 'react'

const links = [
    { label: 'Catálogo', href: '#catalogo' },
    { label: 'Clientes', href: '#clientes' },
    { label: 'Nosotros', href: '#nosotros' },
    { label: 'Presentaciones', href: '#presentaciones' },
    { label: 'Dudas', href: '#dudas' },
]

export default function Navbar() {
    const [open, setOpen] = useState(false)

    return (
        <section className='flex flex-col w-full fixed top-0 bg-white z-50 shadow-sm'>
            <header className='w-full max-w-7xl mx-auto py-2 flex justify-between items-center px-4'>
                <img src="/velmon-horizontal.webp" className='h-9 sm:h-11 object-contain' alt="Velas Montenegro" />

                <nav className='hidden md:flex gap-5 items-center font-medium'>
                    {links.map((link) => (
                        <a key={link.label} href={link.href} className='text-primary hover:underline underline-offset-4'>
                            {link.label}
                        </a>
                    ))}
                    <a
                        href='#cotizacion'
                        className='bg-primary text-white px-3 py-1.5 font-medium rounded-sm hover:bg-primary/80 transition-all'
                    >
                        Contáctanos
                    </a>
                </nav>

                <button
                    type='button'
                    className='md:hidden flex flex-col justify-center items-center gap-1.5 w-10 h-10 -mr-2'
                    aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
                    aria-expanded={open}
                    onClick={() => setOpen((prev) => !prev)}
                >
                    <span className={`block h-0.5 w-6 bg-primary transition-transform ${open ? 'translate-y-2 rotate-45' : ''}`} />
                    <span className={`block h-0.5 w-6 bg-primary transition-opacity ${open ? 'opacity-0' : ''}`} />
                    <span className={`block h-0.5 w-6 bg-primary transition-transform ${open ? '-translate-y-2 -rotate-45' : ''}`} />
                </button>
            </header>

            <nav
                className={`md:hidden flex flex-col gap-1 px-4 bg-white border-t border-primary/10 font-medium overflow-hidden transition-all duration-300 ${open ? 'max-h-80 py-3' : 'max-h-0'
                    }`}
            >
                {links.map((link) => (
                    <a
                        key={link.label}
                        href={link.href}
                        className='text-primary py-2 hover:underline underline-offset-4'
                        onClick={() => setOpen(false)}
                    >
                        {link.label}
                    </a>
                ))}
                <a
                    href='#cotizacion'
                    className='bg-primary text-white px-3 py-2 font-medium rounded-sm hover:bg-primary/80 transition-all mt-2 mb-1 w-full text-center'
                    onClick={() => setOpen(false)}
                >
                    Contáctanos
                </a>
            </nav>
        </section>
    )
}
