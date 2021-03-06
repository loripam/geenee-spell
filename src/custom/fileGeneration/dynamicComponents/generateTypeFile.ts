import {contextForDynamic} from '../../handlebars/context/contextForDynamic'
import {loadFileTemplate} from '../../loadFileTemplate'
import {makeDirs} from '../makeDirs'
import {registerHelpers} from '../../handlebars/registerHelpers'
import {registerPartials} from '../../handlebars/registerPartials'
import {componentName} from './componentName'
import {BoilerPlateInfoType, Configuration, NsInfo, Schema} from 'magicalstrings'
import {replaceCommentDelimiters} from '../replaceCommentDelimiters'

const Handlebars = require('handlebars')
const H = require('just-handlebars-helpers')
const fs = require('fs-extra')
const {singularName} = require('magicalstrings').inflections

H.registerHelpers(Handlebars)

export async function generateTypeFile(
  type: string,
  source: string,
  boilerPlateInfo: BoilerPlateInfoType,
  appInfo: NsInfo,
  currentStack: Schema,
  templateDir: string,
  compDir: string,
  config: Configuration,
) {
  const {componentTypes} = config
  if (!componentTypes) throw new Error('No component types found for the template.')
  const dir = componentName(type, componentTypes[boilerPlateInfo.componentType])
  // console.log(`dir=${dir}`)

  try {
    await registerPartials(`${templateDir}/partials`)
    await registerHelpers(`${templateDir}/helpers`)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error)
    throw new Error(`error registering the partials or helpers at ${templateDir}.
It may be that the template location is faulty, or that the template is not
correctly specified:
${error}`)
  }

  // console.log(`here's a list of helpers: ${JSON.stringify(Handlebars.helpers, null, 2)}`)
  const genericTemplate = await loadFileTemplate(`${templateDir}/generic.hbs`, config)

  const path = `${compDir}/${singularName(source)}/${dir}`
  const dirList = [
    path,
  ]

  const tags = await contextForDynamic(
    type,
    source,
    appInfo,
    currentStack,
    boilerPlateInfo,
    config,
  )

  // if (boilerPlate === 'genericCreationFormRoot') {
  //   console.log(`tags = ${JSON.stringify(tags, null, 2)}`)
  // }
  await makeDirs(dirList)

  try {
    const fileText = await genericTemplate(tags)
    const finalPath = `${path}/index.jsx`
    const finalFileText = replaceCommentDelimiters(
      finalPath, config, fileText
    )
    await fs.outputFile(finalPath, finalFileText)
  } catch (error) {
    throw new Error(`error with generateFromBoilerPlate: ${error}`)
  }
}
