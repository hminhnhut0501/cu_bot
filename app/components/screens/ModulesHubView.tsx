"use client";

import {
  Box,
  Button as MuiButton,
  Card,
  CardContent,
  Chip,
  Grid,
  Paper,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import type { Lookups } from "@/lib/cp-types";
import { moduleAccents } from "@/app/theme";

export type ModulesHubViewProps = {
  enabledModuleCards: any[];
  disabledModuleCards: any[];
  moduleCards: any[];
  moduleState: Map<string, any>;
  lookups: Lookups;
  activeAccent: { line: string; tint: string; color: string };
  saving: boolean;
  setActiveModule: (key: string) => void;
  toggleModule: (key: string) => Promise<void>;
  openModuleConfigure: (moduleKey: string) => void;
};

export default function ModulesHubView({
  enabledModuleCards,
  disabledModuleCards,
  moduleCards,
  moduleState,
  lookups,
  activeAccent,
  saving,
  setActiveModule,
  toggleModule,
  openModuleConfigure,
}: ModulesHubViewProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2.25, bgcolor: "background.paper" }}>
      <Stack direction={{ xs: "column", lg: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", lg: "center" }, mb: 2 }}>
        <Box>
          <Typography variant="overline" color="primary">Module control</Typography>
          <Typography variant="h5">Bật/tắt module và mở từng nhóm chức năng</Typography>
          <Typography variant="body2" color="text.secondary">Module tắt sẽ bị disable trên sidebar, nhưng vẫn có thể bật tại đây.</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Chip color="success" label={`${enabledModuleCards.length} đang bật`} />
          <Chip label={`${disabledModuleCards.length} đang tắt`} />
        </Stack>
      </Stack>
      <Grid container spacing={1.5}>
        {moduleCards.map((module) => {
          const ModuleIcon = module.icon;
          const states = (module.moduleKeys || [module.key]).map((key: string) => moduleState.get(key)).filter(Boolean);
          const pendingCount =
            module.key === "anti_scam" ? lookups.scamReports.filter((row) => String(row.status || "pending") === "pending").length :
            module.key === "channel_publisher" ? lookups.channelPosts.filter((row) => ["pending", "queued", "scheduled"].includes(String(row.status || "").toLowerCase())).length :
            module.key === "automation" ? lookups.groups.filter((group) => group.daily_enabled !== false).length :
            0;
          return (
            <Grid key={module.key} size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}>
              <Card
                variant="outlined"
                sx={{
                  height: "100%",
                  borderColor: module.isOn ? moduleAccents[module.tone as keyof typeof moduleAccents]?.line || activeAccent.line : "divider",
                  opacity: module.isOn ? 1 : 0.72,
                  backgroundImage: module.isOn
                    ? `linear-gradient(180deg, ${moduleAccents[module.tone as keyof typeof moduleAccents]?.tint || activeAccent.tint}, transparent 70%)`
                    : "none",
                }}
              >
                <CardContent>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1.25} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
                      <Stack direction="row" spacing={1.25} sx={{ minWidth: 0 }}>
                        <Box sx={{ color: module.isOn ? (moduleAccents[module.tone as keyof typeof moduleAccents]?.color || activeAccent.color) : "text.secondary", pt: 0.25 }}>
                          <ModuleIcon size={20} />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle1">{module.title}</Typography>
                          <Typography variant="body2" color="text.secondary">{module.desc}</Typography>
                        </Box>
                      </Stack>
                      <Switch
                        checked={module.isOn}
                        disabled={saving}
                        onChange={() => {
                          setActiveModule(module.key);
                          void toggleModule((module.moduleKeys || [module.key])[0]);
                        }}
                      />
                    </Stack>
                    <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap" }}>
                      <Chip size="small" color={module.isOn ? "success" : "default"} label={module.isOn ? "ON" : "OFF"} />
                      <Chip size="small" variant="outlined" label={`${module.tables.length} bảng`} />
                      <Chip size="small" variant="outlined" label={`${module.configKeys?.length || 0} config`} />
                      {states.length ? <Chip size="small" variant="outlined" label={`${states.length} state`} /> : null}
                      {pendingCount ? <Chip size="small" color="warning" variant="outlined" label={`${pendingCount} pending`} /> : null}
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <MuiButton fullWidth variant={module.isOn ? "contained" : "outlined"} onClick={() => openModuleConfigure(module.key)}>
                        Cài đặt
                      </MuiButton>
                      {!module.isOn ? (
                        <MuiButton variant="contained" color="success" disabled={saving} onClick={() => {
                          setActiveModule(module.key);
                          void toggleModule((module.moduleKeys || [module.key])[0]);
                        }}>
                          Bật
                        </MuiButton>
                      ) : null}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Paper>
  );
}
