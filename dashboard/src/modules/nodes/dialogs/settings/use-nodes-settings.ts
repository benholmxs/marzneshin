import { useEffect, useState } from "react";
import YAML from "yaml";
import {
  type NodeType,
  NodeBackendSettingConfigFormat,
  useNodesSettingsMutation,
  useNodesSettingsQuery,
} from "../..";

const parseConfig = (data: {
  config: string;
  format: NodeBackendSettingConfigFormat;
}) => {
  return {
    [NodeBackendSettingConfigFormat.PLAIN]: () => data.config,
    [NodeBackendSettingConfigFormat.JSON]: () =>
      JSON.stringify(JSON.parse(data.config), null, "    "),
    [NodeBackendSettingConfigFormat.YAML]: () =>
      YAML.stringify(YAML.parse(data.config), null, "    "),
  }[data.format]();
};

const parseLanguage = (format: NodeBackendSettingConfigFormat) =>
  ({
    [NodeBackendSettingConfigFormat.PLAIN]: "text",
    [NodeBackendSettingConfigFormat.JSON]: "json",
    [NodeBackendSettingConfigFormat.YAML]: "yaml",
  })[format];

export const useNodesSettings = (entity: NodeType, backend: string) => {
  const { data, isFetching } = useNodesSettingsQuery(entity, backend);
  const [config, setConfig] = useState<string>(parseConfig(data));
  const [payloadValidity, setPayloadValidity] = useState<boolean>(true);
  const mutate = useNodesSettingsMutation();
  const language = parseLanguage(data.format);

  useEffect(() => {
    if (!isFetching) {
      const parsed = parseConfig(data);
      setConfig((prev: string) => (prev !== parsed ? parsed : prev));
    }
  }, [isFetching, data]);

  const handleEditorValidation = (markers: any[]) => {
    setPayloadValidity(!markers.length);
  };

  const handleConfigSave = () => {
    mutate.mutate({ node: entity, backend, config, format: data.format });
  };

  const handleConfigChange = (newConfig: string | undefined) => {
    if (newConfig) {
      try {
        setConfig(newConfig);
        setPayloadValidity(true);
      } catch (error) {
        setPayloadValidity(false);
      }
    }
  };

  return {
    payloadValidity,
    language,
    isFetching,
    config,
    handleConfigSave,
    handleConfigChange,
    handleEditorValidation,
  };
};
