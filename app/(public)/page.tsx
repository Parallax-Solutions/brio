"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Wallet,
  TrendingUp,
  PieChart,
  RefreshCw,
  Shield,
  Smartphone,
  Globe,
  Zap,
  CheckCircle2,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Globe,
    title: "Multi-Moneda",
    titleEn: "Multi-Currency",
    description: "Gestiona colones, dólares y más. Conversión automática con tipos de cambio actualizados.",
    descriptionEn: "Manage colones, dollars and more. Automatic conversion with updated exchange rates.",
  },
  {
    icon: RefreshCw,
    title: "Gastos Recurrentes",
    titleEn: "Recurring Expenses",
    description: "Controla tus pagos mensuales, servicios y suscripciones en un solo lugar.",
    descriptionEn: "Track monthly payments, services and subscriptions in one place.",
  },
  {
    icon: PieChart,
    title: "Visualización Clara",
    titleEn: "Clear Visualization",
    description: "Gráficos intuitivos que te muestran exactamente a dónde va tu dinero.",
    descriptionEn: "Intuitive charts showing exactly where your money goes.",
  },
  {
    icon: TrendingUp,
    title: "Metas de Ahorro",
    titleEn: "Savings Goals",
    description: "Define objetivos de ahorro y sigue tu progreso hacia la libertad financiera.",
    descriptionEn: "Set savings goals and track your progress toward financial freedom.",
  },
  {
    icon: Shield,
    title: "Seguro y Privado",
    titleEn: "Secure & Private",
    description: "Tus datos financieros protegidos con encriptación de nivel bancario.",
    descriptionEn: "Your financial data protected with bank-level encryption.",
  },
  {
    icon: Smartphone,
    title: "100% Responsivo",
    titleEn: "100% Responsive",
    description: "Accede desde cualquier dispositivo. Tu presupuesto siempre contigo.",
    descriptionEn: "Access from any device. Your budget always with you.",
  },
];

const benefits = [
  "Gratis para siempre",
  "Sin anuncios molestos",
  "Datos en la nube",
  "Soporte en español",
  "Actualizaciones constantes",
  "Hecho en Costa Rica",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Wallet className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Brio</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
            <Button asChild>
              <Link href="/register">
                Comenzar Gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-chart-2/10 blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <span>La app de finanzas #1 en Costa Rica</span>
            </div>
            
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Toma el Control de{" "}
              <span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                Tus Finanzas
              </span>
            </h1>
            
            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Gestiona tu presupuesto en <strong>colones y dólares</strong>, 
              controla gastos recurrentes, suscripciones e ingresos. 
              Todo en una aplicación <strong>gratuita</strong> y fácil de usar.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="h-12 px-8 text-base" asChild>
                <Link href="/register">
                  <Zap className="mr-2 h-5 w-5" />
                  Crear Cuenta Gratis
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
                <Link href="/login">
                  Ya tengo cuenta
                </Link>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {benefits.slice(0, 3).map((benefit) => (
                <div key={benefit} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32" id="caracteristicas">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Todo lo que Necesitas para tu{" "}
              <span className="text-primary">Bienestar Financiero</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Diseñado específicamente para Costa Rica, con soporte multi-moneda 
              y todas las herramientas para manejar tus finanzas personales.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group rounded-2xl border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-8 text-primary-foreground sm:p-12 lg:p-16"
          >
            <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            
            <div className="relative mx-auto max-w-2xl text-center">
              <div className="mb-6 inline-flex items-center gap-1 text-sm font-medium">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
              </div>
              
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Comienza a Ahorrar Hoy
              </h2>
              <p className="mb-8 text-lg opacity-90">
                Únete a miles de costarricenses que ya controlan sus finanzas con Brio. 
                Sin tarjeta de crédito, sin compromisos.
              </p>
              
              <Button
                size="lg"
                variant="secondary"
                className="h-12 px-8 text-base"
                asChild
              >
                <Link href="/register">
                  Crear Mi Cuenta Gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm opacity-80">
                {benefits.slice(3).map((benefit) => (
                  <div key={benefit} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Wallet className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">Brio</span>
              <span className="text-sm text-muted-foreground">
                — Finanzas con Espíritu
              </span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span>© {new Date().getFullYear()} Parallax Solutions</span>
              <span>Hecho con 💚 en Costa Rica</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
