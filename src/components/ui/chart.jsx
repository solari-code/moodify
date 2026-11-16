"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Chart wrapper after shadcn/ui's chart component, trimmed to what Moodify
// uses: a responsive container that themes Recharts' axes, grid and cursor
// with the app's colors, and the Tooltip re-export. Series colors are passed
// via `config` ({ key: { label, color } }) and available as var(--color-key).

const ChartContext = React.createContext(null)

export function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) throw new Error("useChart must be used within a <ChartContainer />")
  return context
}

const ChartContainer = React.forwardRef(({ config = {}, className, style, children, ...props }, ref) => {
  const colorVars = Object.fromEntries(
    Object.entries(config)
      .filter(([, item]) => item.color)
      .map(([key, item]) => [`--color-${key}`, item.color])
  )

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        ref={ref}
        className={cn(
          "flex w-full justify-center text-xs",
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground",
          "[&_.recharts-cartesian-grid_line]:stroke-border",
          "[&_.recharts-curve.recharts-tooltip-cursor]:stroke-border",
          "[&_.recharts-reference-line_line]:stroke-border",
          "[&_.recharts-surface]:outline-none [&_.recharts-wrapper]:outline-none",
          className
        )}
        style={{ ...colorVars, ...style }}
        {...props}
      >
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "ChartContainer"

const ChartTooltip = RechartsPrimitive.Tooltip

export { ChartContainer, ChartTooltip }
