import json
import sys

try:
    import unreal
except Exception:
    unreal = None


def get_dependencies(asset_path, visited=None):
    if unreal is None:
        return {"name": asset_path, "dependencies": []}

    if visited is None:
        visited = set()
    if asset_path in visited:
        return {"name": asset_path, "dependencies": []}
    visited.add(asset_path)

    registry = unreal.AssetRegistryHelpers.get_asset_registry()
    opts = unreal.AssetRegistryDependencyOptions(include_soft_references=True,
                                                 include_hard_references=True,
                                                 include_searchable_names=False,
                                                 include_management_references=False)
    deps = registry.get_dependencies(asset_path, opts)
    children = [get_dependencies(dep, visited) for dep in deps]
    return {"name": asset_path, "dependencies": children}


def main():
    if len(sys.argv) < 2:
        print("{}".format(json.dumps({})))
        return
    asset = sys.argv[1]
    tree = get_dependencies(asset)
    print(json.dumps(tree))


if __name__ == "__main__":
    main()
