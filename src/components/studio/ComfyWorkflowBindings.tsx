import { Field } from '@/components/common/FormSection'
import { WorkflowParameters } from '@/components/studio/WorkflowParameters'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ComfyParsedNodes } from '@/services/aiGenerator'
import type { ComfyUiParams } from '@/types/gallery'

type ComfyWorkflowBindingsProps = {
  params: ComfyUiParams
  parsedNodes: ComfyParsedNodes
  showAdvanced: boolean
  onChange: (patch: Partial<ComfyUiParams>) => void
  onPreview: (url: string) => void
  onUploadingChange: (id: string | null) => void
}

export function ComfyWorkflowBindings({
  params,
  parsedNodes,
  showAdvanced,
  onChange,
  onPreview,
  onUploadingChange,
}: ComfyWorkflowBindingsProps) {
  return (
    <>
      {!parsedNodes.valid && (
        <div className="col-span-full rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {parsedNodes.error}
        </div>
      )}

      <Field label="人像图节点 (LoadImage)">
        <Select value={params.portraitNodeId} onValueChange={(v) => onChange({ portraitNodeId: v })}>
          <SelectTrigger className="w-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">不绑定</SelectItem>
            {parsedNodes.imageNodes.map((node) => (
              <SelectItem key={node.id} value={node.id} className="text-xs">
                #{node.id} {node.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="服装图节点 (LoadImage)">
        <Select value={params.costumeNodeId} onValueChange={(v) => onChange({ costumeNodeId: v })}>
          <SelectTrigger className="w-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">不绑定</SelectItem>
            {parsedNodes.imageNodes.map((node) => (
              <SelectItem key={node.id} value={node.id} className="text-xs">
                #{node.id} {node.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="姿势图节点 (LoadImage)">
        <Select value={params.poseNodeId} onValueChange={(v) => onChange({ poseNodeId: v })}>
          <SelectTrigger className="w-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">不绑定</SelectItem>
            {parsedNodes.imageNodes.map((node) => (
              <SelectItem key={node.id} value={node.id} className="text-xs">
                #{node.id} {node.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="正向提示词节点 (Prompt)">
        <Select value={params.promptNodeId} onValueChange={(v) => onChange({ promptNodeId: v })}>
          <SelectTrigger className="w-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">保留工作流原提示词</SelectItem>
            {parsedNodes.promptNodes.map((node) => (
              <SelectItem key={node.id} value={node.id} className="text-xs">
                #{node.id} {node.title} ({node.field})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {showAdvanced && <WorkflowParameters onPreview={onPreview} onUploadingChange={onUploadingChange} />}
    </>
  )
}
