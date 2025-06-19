import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cardVariants = cva(
  "flex flex-col gap-6 rounded-xl border py-6 shadow-sm transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground hover:shadow-md",
        "accent-yellow": "bg-card text-card-foreground border-l-4 border-l-signal-yellow hover:shadow-lg hover:border-l-8",
        "accent-orange": "bg-card text-card-foreground border-l-4 border-l-orange-500 hover:shadow-lg hover:border-l-8",
        "accent-blue": "bg-card text-card-foreground border-l-4 border-l-brilliant-blue hover:shadow-lg hover:border-l-8",
        "accent-plum": "bg-card text-card-foreground border-l-4 border-l-plum hover:shadow-lg hover:border-l-8",
        "highlight-yellow": "bg-gradient-to-r from-signal-yellow/5 to-transparent border-l-4 border-l-signal-yellow hover:shadow-lg hover:from-signal-yellow/10",
        "highlight-blue": "bg-gradient-to-r from-brilliant-blue/5 to-transparent border-l-4 border-l-brilliant-blue hover:shadow-lg hover:from-brilliant-blue/10",
        "premium": "bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-2 border-signal-yellow/20 hover:border-signal-yellow/40 hover:shadow-xl",
        "glass": "bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 hover:shadow-xl",
        "minimal": "bg-card text-card-foreground border-0 shadow-none hover:shadow-sm hover:bg-muted/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface CardProps extends React.ComponentProps<"div">, VariantProps<typeof cardVariants> {}

function Card({ className, variant, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold text-foreground", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  cardVariants,
  type CardProps,
}
